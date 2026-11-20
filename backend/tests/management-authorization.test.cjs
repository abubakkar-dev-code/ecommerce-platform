const assert = require("node:assert/strict");
const { once } = require("node:events");
const { test, mock } = require("node:test");
const jwt = require("jsonwebtoken");

// Import the compiled app, never server.ts. All integration settings are dummy.
for (const key of [
  "MONGODB_URI", "JWT_SECRET", "CLIENT_ID", "CLIENT_SECRET", "MAIL_HOST",
  "MAIL_USER", "MAIL_PASSWORD", "MAIL_FROM", "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET", "RAZOR_PAY_KEY", "RAZOR_PAY_SECRET",
]) process.env[key] = "management-security-test-only";
process.env.JWT_EXPIRES_IN = "1h";
process.env.CLIENT_CALLBACK_URI = "http://127.0.0.1/google/callback";
process.env.MAIL_PORT = "2525";

const id = "111111111111111111111111";
const accounts = {
  admin: { role: "admin", isActive: true },
  customer: { role: "customer", isActive: true },
  disabled: { role: "admin", isActive: false },
  deleted: null,
};
const User = require("../dist/models/user.model.js").default;
const accountIds = Object.fromEntries(Object.keys(accounts).map((name, index) => [name, String(index + 1).repeat(24)]));
const lookup = mock.method(User, "findById", async (userId) => accounts[Object.keys(accountIds).find((name) => accountIds[name] === userId)] ?? null);
const tokens = Object.fromEntries(Object.keys(accounts).map((name) => [
  name, jwt.sign({ userId: accountIds[name] }, process.env.JWT_SECRET, { expiresIn: "5m" }),
]));

// Explicit endpoint/controller matrix: adding or removing a route requires review.
const modules = [
  ["product", "/api/products", [
    ["POST", "/create-product", "createProduct"],
    ["PATCH", `/${id}`, "updateProduct"],
    ["DELETE", `/${id}`, "deleteProduct"],
  ], [
    ["/", "getProducts"], ["/search?search=shoe", "searchProducts"],
    ["/filter", "filterProducts"], [`/${id}`, "getSingleProduct"],
  ]],
  ["productVariant", "/api/varients", [
    ["POST", "/create-varient", "createProductVariant"],
    ["PATCH", `/${id}`, "updatevarient"], ["DELETE", `/${id}`, "deleteVarient"],
  ], [[`/${id}`, "getVarient"], [`/getSingleVarient/${id}`, "getVrientById"]]],
  ["inventory", "/api/inventories", [
    ["POST", "/create-inventory", "createInventory"],
    ["PATCH", `/${id}`, "updateInventory"], ["DELETE", `/${id}`, "deleteInventory"],
  ], []],
  ["image", "/api/product-images", [
    ["POST", `/${id}`, "createImage"],
    ["PATCH", `/${id}`, "updatePrimaryImage"],
    ["PATCH", `/${id}/thumbnails`, "updateThumbnails"],
    ["DELETE", `/${id}`, "deletePrimaryImage"],
    ["DELETE", `/${id}/thumbnail`, "deleteThumbnails"],
  ], [[`/${id}`, "getImages"]]],
  ["category", "/api/categories", [
    ["POST", "/create-category", "createCategory"],
    ["PATCH", `/${id}`, "updateCategories"], ["DELETE", `/${id}`, "deleteCategory"],
  ], [["/", "getCategories"], ["/shoes", "getCategoriesBySlug"]]],
  ["brand", "/api/brands", [
    ["POST", "/create-brand", "createBrand"],
    ["PATCH", `/${id}`, "updateBrand"], ["DELETE", `/${id}`, "deleteBrand"],
  ], [["/", "getBrands"], [`/${id}`, "getBrandById"]]],
];

// Stub controller bodies, but keep real routing, JWT verification, role lookup,
// authorization, Multer parsing, and error middleware. No business writes occur.
const controllers = [];
for (const [moduleName, , writes, reads] of modules) {
  const module = require(`../dist/controllers/${moduleName}.controller.js`);
  const names = [...writes.map((entry) => entry[2]), ...reads.map((entry) => entry[1])];
  for (const name of names) {
    controllers.push(mock.method(module, name, (_req, res) => res.json({ controller: name })));
  }
}

// Exercise the real inventory read handler with a mocked DB result.
const { Inventory } = require("../dist/models/Inventory.model.js");
let stock = { _id: "private-id", varient: id, quantity: 8, reservedQuantity: 3,
  lowStockThreshold: 5, createdAt: "private-time", updatedAt: "private-time", __v: 0 };
mock.method(Inventory, "findOne", async (query) => {
  assert.deepEqual(query, { varient: id });
  return stock;
});

// Wrap actual upload handlers to prove they are never entered on denied requests.
const upload = require("../dist/middleware/upload.middleware.js").default;
const uploadHandlers = [];
for (const name of ["fields", "single", "array"]) {
  const original = upload[name];
  mock.method(upload, name, function (...args) {
    const handler = original.apply(this, args);
    const wrapped = mock.fn((req, res, next) => handler(req, res, next));
    uploadHandlers.push(wrapped);
    return wrapped;
  });
}
// Authorized multipart requests use local fake storage, never Cloudinary.
const storage = mock.method(upload.storage, "_handleFile", (_req, file, callback) => {
  file.stream.resume();
  callback(null, { path: "test-image", filename: "test-image" });
});
const cloudinary = require("../dist/config/cloudinary.js").default;
const provider = mock.method(cloudinary.uploader, "upload_stream", () => {
  throw new Error("External uploads are forbidden in authorization tests");
});
const app = require("../dist/app.js").default;
const calls = (mocks) => mocks.reduce((sum, fn) => sum + fn.mock.callCount(), 0);

test("F1 management access and public reads", async (t) => {
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = (path, method, token, body) => fetch(base + path, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    ...(body ? { body } : {}),
  });
  try {
    for (const [, prefix, writes] of modules) {
      for (const [method, suffix, controller] of writes) {
        const path = prefix + suffix;
        await t.test(`${method} ${path}: anonymous 401, customer 403, admin reaches ${controller}`, async () => {
          for (const [token, expected] of [[undefined, 401], [tokens.customer, 403], ["invalid-token", 401], [tokens.disabled, 403], [tokens.deleted, 401]]) {
            const before = calls(controllers);
            const beforeUploads = calls(uploadHandlers);
            const response = await request(path, method, token);
            assert.equal(response.status, expected);
            assert.equal((await response.json()).success, false);
            assert.equal(calls(controllers), before);
            assert.equal(calls(uploadHandlers), beforeUploads);
          }
          const response = await request(path, method, tokens.admin);
          assert.equal(response.status, 200);
          assert.deepEqual(await response.json(), { controller });
        });
      }
    }

    for (const [, prefix, , reads] of modules) {
      for (const [suffix, controller] of reads) {
        await t.test(`guest GET ${prefix + suffix} reaches ${controller}`, async () => {
          const before = lookup.mock.callCount();
          const response = await request(prefix + suffix, "GET");
          assert.equal(response.status, 200);
          assert.deepEqual(await response.json(), { controller });
          assert.equal(lookup.mock.callCount(), before);
        });
      }
    }

    await t.test("guest inventory read returns availability only", async () => {
      for (const [quantity, reservedQuantity, inStock] of [[8, 3, true], [3, 3, false], [0, 0, false], [2, 3, false]]) {
        stock = { ...stock, quantity, reservedQuantity };
        const response = await request(`/api/inventories/varient/${id}`, "GET");
        assert.equal(response.status, 200);
        const result = await response.json();
        assert.deepEqual(result.data, { varient: id, inStock });
      }
      stock = null;
      const missing = await request(`/api/inventories/varient/${id}`, "GET");
      assert.equal(missing.status, 404);
    });

    for (const [method, suffix, field, controller] of [
      ["POST", `/${id}`, "primaryImage", "createImage"],
      ["PATCH", `/${id}`, "primaryImage", "updatePrimaryImage"],
      ["PATCH", `/${id}/thumbnails`, "thumbnails", "updateThumbnails"],
    ]) {
      await t.test(`${method} multipart ${suffix}: guards run before upload`, async () => {
        for (const [token, expected] of [[undefined, 401], [tokens.customer, 403], [tokens.deleted, 401], [tokens.disabled, 403]]) {
          const body = new FormData();
          body.append(field, new Blob(["test-image"], { type: "image/jpeg" }), "test.jpg");
          const beforeUploads = calls(uploadHandlers);
          const beforeStorage = storage.mock.callCount();
          const beforeControllers = calls(controllers);
          const response = await request("/api/product-images" + suffix, method, token, body);
          assert.equal(response.status, expected);
          await response.json();
          assert.equal(calls(uploadHandlers), beforeUploads);
          assert.equal(storage.mock.callCount(), beforeStorage);
          assert.equal(calls(controllers), beforeControllers);
        }
        const body = new FormData();
        body.append(field, new Blob(["test-image"], { type: "image/jpeg" }), "test.jpg");
        const before = storage.mock.callCount();
        const response = await request("/api/product-images" + suffix, method, tokens.admin, body);
        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), { controller });
        assert.equal(storage.mock.callCount(), before + 1);
        assert.equal(provider.mock.callCount(), 0);
      });
    }

    await t.test("deleted admin is rejected by authentication", async () => {
      const before = calls(controllers);
      const response = await request(`/api/products/${id}`, "DELETE", tokens.deleted);
      assert.equal(response.status, 401);
      assert.equal(calls(controllers), before);
    });

    await t.test("disabled admins are rejected before reaching the controller", async () => {
      const before = calls(controllers);
      const response = await request(`/api/products/${id}`, "PATCH", tokens.disabled);
      assert.equal(response.status, 403);
      assert.equal(calls(controllers), before);
    });
    assert.equal(provider.mock.callCount(), 0);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    mock.restoreAll();
  }
});
