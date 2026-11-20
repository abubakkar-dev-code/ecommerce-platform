const assert = require("node:assert/strict");
const { once } = require("node:events");
const { test, mock } = require("node:test");
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

for (const key of [
  "MONGODB_URI", "JWT_SECRET", "CLIENT_ID", "CLIENT_SECRET", "MAIL_HOST",
  "MAIL_USER", "MAIL_PASSWORD", "MAIL_FROM", "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET", "RAZOR_PAY_KEY", "RAZOR_PAY_SECRET",
]) process.env[key] = "account-status-test-only";
process.env.JWT_EXPIRES_IN = "1h";
process.env.CLIENT_CALLBACK_URI = "http://127.0.0.1/google/callback";
process.env.MAIL_PORT = "2525";

const password = "correct-test-password";
const hash = bcrypt.hashSync(password, 4);
const accounts = Object.fromEntries([
  ["activeCustomer", "customer", true], ["activeAdmin", "admin", true],
  ["disabledCustomer", "customer", false], ["disabledAdmin", "admin", false],
].map(([name, role, isActive], i) => [name, {
  _id: String(i + 1).repeat(24), name, email: `${name.toLowerCase()}@example.test`, googleId: `google-${name}`,
  role, isActive, password: hash,
}]));
const deletedId = "999999999999999999999999";
const User = require("../dist/models/user.model.js").default;
mock.method(User, "findById", async (id) =>
  Object.values(accounts).find((user) => user._id === String(id)) ?? null);
mock.method(User, "findOne", ({ email, googleId }) => {
  const result = Object.values(accounts).find((user) => googleId ? user.googleId === googleId : user.email === email) ?? null;
  const query = Promise.resolve(result);
  query.select = () => query;
  return query;
});
mock.method(User, "exists", async ({ email }) => Object.values(accounts).find((user) => user.email === email) ?? null);
mock.method(require("../dist/models/session.model.js").default, "create", async (session) => session);
const create = mock.method(User, "create", async (fields) => ({
  ...fields, _id: "888888888888888888888888", isActive: true,
}));

const { authenticate } = require("../dist/middleware/auth.middleware.js");
const { authorize } = require("../dist/middleware/authorize.middleware.js");
const { loginUser, googleCallback } = require("../dist/controllers/user.controller.js");
const passport = require("../dist/config/passport.js").default;
const errors = require("../dist/middleware/error.middleware.js").default;
const sign = (id, options = {}) => jwt.sign({ userId: id }, process.env.JWT_SECRET, {
  expiresIn: "5m", ...options,
});

test("F3 account existence and activity without session changes", async (t) => {
  const app = express();
  app.use(express.json());
  let protectedCalls = 0;
  app.get("/protected", authenticate, (req, res) => {
    protectedCalls++;
    res.json({ userId: req.user.userId });
  });
  app.get("/admin", authenticate, authorize("admin"), (_req, res) => res.json({ ok: true }));
  app.post("/login", loginUser);
  // Test-only Passport identity stand-in: Google network calls are never made.
  app.get("/oauth-complete/:id", (req, _res, next) => {
    req.user = { _id: req.params.id };
    next();
  }, googleCallback);
  app.use(errors);
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const [name, user] of Object.entries(accounts)) {
      await t.test(`${name}: JWT access, password login, OAuth identity and callback`, async () => {
        const before = protectedCalls;
        const response = await fetch(base + "/protected", {
          headers: { Authorization: `Bearer ${sign(user._id)}` },
        });
        assert.equal(response.status, user.isActive ? 200 : 403);
        assert.equal(protectedCalls, before + (user.isActive ? 1 : 0));
        if (user.isActive) assert.deepEqual(await response.json(), { userId: user._id });

        const admin = await fetch(base + "/admin", {
          headers: { Authorization: `Bearer ${sign(user._id)}` },
        });
        assert.equal(admin.status, user.isActive && user.role === "admin" ? 200 : 403);

        const login = await fetch(base + "/login", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email, password }),
        });
        assert.equal(login.status, user.isActive ? 200 : 403);
        const body = await login.json();
        if (user.isActive) {
          const claims = jwt.verify(body.data.token, process.env.JWT_SECRET);
          assert.equal(claims.userId, user._id);
          assert.equal(claims.exp - claims.iat, 3600);
        } else {
          assert.equal(body.success, false);
          assert.equal(body.data, undefined);
        }

        // Exercise the registered Google strategy's real verification callback.
        const outcome = await new Promise((resolve) => passport._strategy("google")._verify(
          "unused", "unused", { id: user.googleId, displayName: name,
            emails: [{ value: user.email, verified: true }] },
          (error, identity) => resolve({ error, identity }),
        ));
        if (user.isActive) assert.equal(outcome.identity, user);
        else {
          assert.equal(outcome.error.statusCode, 403);
          assert.equal(outcome.identity, undefined);
        }

        const callback = await fetch(`${base}/oauth-complete/${user._id}`, { redirect: "manual" });
        assert.equal(callback.status, user.isActive ? 302 : 403);
        if (user.isActive) {
          const location = new URL(callback.headers.get("location"));
          assert.equal(location.search, "");
          const access = callback.headers.getSetCookie()[0].split(";")[0].split("=")[1];
          assert.equal(jwt.verify(access, process.env.JWT_SECRET).userId, user._id);
        } else assert.equal(callback.headers.get("location"), null);
      });
    }

    await t.test("deleted accounts cannot use an old JWT, password login, or stale OAuth identity", async () => {
      const before = protectedCalls;
      const token = sign(deletedId);
      for (const path of ["/protected", "/admin"]) {
        const response = await fetch(base + path, { headers: { Authorization: `Bearer ${token}` } });
        assert.equal(response.status, 401);
      }
      assert.equal(protectedCalls, before);
      const login = await fetch(base + "/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "deleted@example.test", password }),
      });
      assert.equal(login.status, 400); // Existing missing-user login contract.
      assert.equal((await login.json()).data, undefined);
      const callback = await fetch(`${base}/oauth-complete/${deletedId}`, { redirect: "manual" });
      assert.equal(callback.status, 401);
      assert.equal(callback.headers.get("location"), null);
    });

    await t.test("already-issued tokens track later account changes", async () => {
      const user = accounts.activeCustomer;
      const token = sign(user._id);
      user.isActive = false;
      let response = await fetch(base + "/protected", { headers: { Authorization: `Bearer ${token}` } });
      assert.equal(response.status, 403);
      delete accounts.activeCustomer;
      response = await fetch(base + "/protected", { headers: { Authorization: `Bearer ${token}` } });
      assert.equal(response.status, 401);
      accounts.activeCustomer = user;
      user.isActive = true;
    });

    await t.test("wrong passwords and invalid/expired JWTs remain rejected", async () => {
      const user = accounts.activeCustomer;
      const login = await fetch(base + "/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, password: "wrong" }),
      });
      assert.equal(login.status, 401);
      for (const token of ["invalid", sign(user._id, { expiresIn: -1 })]) {
        const response = await fetch(base + "/protected", { headers: { Authorization: `Bearer ${token}` } });
        assert.equal(response.status, 401);
      }
    });

    await t.test("new Google signup still creates an active account", async () => {
      const outcome = await new Promise((resolve) => passport._strategy("google")._verify(
        "unused", "unused", { id: "new-google-subject", displayName: "New user",
          emails: [{ value: "new@example.test", verified: true }] },
        (error, identity) => resolve({ error, identity }),
      ));
      assert.equal(outcome.error, null);
      assert.equal(outcome.identity.isActive, true);
      assert.equal(create.mock.callCount(), 1);
    });
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    mock.restoreAll();
  }
});
