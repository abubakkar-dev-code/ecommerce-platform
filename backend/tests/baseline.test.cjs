const assert = require("node:assert/strict");
const { once } = require("node:events");
const { test } = require("node:test");

// Override every required integration setting before importing the application.
// Import app, never server: no MongoDB connection or external service call occurs.
for (const key of [
  "MONGODB_URI", "JWT_SECRET", "JWT_EXPIRES_IN", "CLIENT_ID",
  "CLIENT_SECRET", "MAIL_HOST", "MAIL_USER", "MAIL_PASSWORD", "MAIL_FROM",
  "CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET",
  "RAZOR_PAY_KEY", "RAZOR_PAY_SECRET",
]) {
  process.env[key] = "baseline-test-only";
}
process.env.CLIENT_CALLBACK_URI = "http://127.0.0.1/google/callback";
process.env.MAIL_PORT = "2525";
const app = require("../dist/app.js").default;

test("compiled app initializes and mounts the API without external services", async () => {
  const server = app.listen(0, "127.0.0.1");
  try {
    await once(server, "listening");
    const base = `http://127.0.0.1:${server.address().port}`;
    const health = await fetch(`${base}/api/health`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { status: "ok" });

    assert.equal((await fetch(`${base}/api/ready`)).status, 503);
    const missing = await fetch(`${base}/api/does-not-exist`);
    assert.equal(missing.status, 404);
    assert.equal((await missing.json()).success, false);

    for (const path of ["users/profile", "cart", "wishList", "address", "orders"]) {
      const response = await fetch(`${base}/api/${path}`);
      assert.equal(response.status, 401, path);
    }
    const payment = await fetch(`${base}/api/payment`, { method: "POST" });
    assert.equal(payment.status, 401);

    // The remaining routers can be checked through validation paths, before DB work.
    for (const path of ["products/search", "ai/chat", "ai/recommendations"]) {
      const response = await fetch(`${base}/api/${path}`, {
        method: path.startsWith("ai/") ? "POST" : "GET",
      });
      assert.equal(response.status, 400, path);
    }

    // Inspect routing only for endpoints whose handlers require external services.
    const routers = app.router.stack.filter((layer) => Array.isArray(layer.handle.stack));
    assert.equal(routers.length, 15);
    const imageRouter = routers.find((layer) =>
      layer.handle.stack.some((entry) => entry.route?.path === "/:productImageId/thumbnails"),
    );
    assert.ok(imageRouter, "thumbnail update has its own route");
    const patches = imageRouter.handle.stack
      .filter((entry) => entry.route?.methods.patch)
      .map((entry) => entry.route.path);
    assert.deepEqual(patches, ["/:productImageId", "/:productImageId/thumbnails"]);

    for (const path of ["/api/categories/example", "/api/brands/example"]) {
      const response = await fetch(`${base}${path}`, { method: "PATCH" });
      assert.equal(response.status, 401, path);
    }
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
