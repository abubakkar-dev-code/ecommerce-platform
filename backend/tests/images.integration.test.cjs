const assert = require("node:assert/strict");
const { once } = require("node:events");
const { Writable } = require("node:stream");
const { test, mock } = require("node:test");
const sharp = require("sharp");
const jwt = require("jsonwebtoken");
const { startIsolatedMongo } = require("./helpers/isolated-mongo.cjs");

test("C2 image validation, persistence and durable cleanup", async (t) => {
  const db = await startIsolatedMongo();
  let server;
  try {
    for (const key of ["JWT_SECRET", "CLIENT_ID", "CLIENT_SECRET", "MAIL_HOST", "MAIL_USER", "MAIL_PASSWORD", "MAIL_FROM",
      "CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET", "RAZOR_PAY_KEY", "RAZOR_PAY_SECRET"]) process.env[key] = "image-test-only";
    process.env.MONGODB_URI = db.uri;
    process.env.JWT_EXPIRES_IN = "1h";
    process.env.CLIENT_CALLBACK_URI = "http://127.0.0.1/google/callback";
    process.env.MAIL_PORT = "2525";
    const User = require("../dist/models/user.model.js").default;
    const Brand = require("../dist/models/brand.model.js").default;
    const Category = require("../dist/models/category.model.js").default;
    const Product = require("../dist/models/product.model.js").default;
    const Image = require("../dist/models/productImageSchema.js").default;
    const Asset = require("../dist/models/imageAsset.model.js").default;
    await Promise.all([User, Brand, Category, Product, Image, Asset].map((model) => model.init()));
    const brand = await Brand.create({ name: "Brand", slug: "brand" });
    const category = await Category.create({ name: "Category", slug: "category" });
    const product = await Product.create({ name: "Product", slug: "product", category: category._id, brand: brand._id });
    const otherProduct = await Product.create({ name: "Other", slug: "other", category: category._id, brand: brand._id });
    const admin = await User.create({ name: "Admin", email: "admin@example.test", role: "admin" });
    const customer = await User.create({ name: "Customer", email: "customer@example.test" });
    const adminToken = jwt.sign({ userId: String(admin._id) }, process.env.JWT_SECRET);
    const customerToken = jwt.sign({ userId: String(customer._id) }, process.env.JWT_SECRET);
    const cloudinary = require("../dist/config/cloudinary.js").default;
    let failUploadAt = -1;
    let failDestroy = false;
    let uploadNumber = 0;
    const removed = [];
    const upload = mock.method(cloudinary.uploader, "upload_stream", (options, callback) => {
      const n = ++uploadNumber;
      return new Writable({ write(_chunk, _encoding, done) { done(); }, final(done) {
        if (n === failUploadAt) callback(new Error("provider failed"));
        else callback(null, { public_id: options.public_id, secure_url: "https://example.test/" + options.public_id });
        done();
      } });
    });
    mock.method(cloudinary.uploader, "destroy", async (id, options) => {
      assert.deepEqual(options, { resource_type: "image", invalidate: true });
      if (failDestroy) throw new Error("provider unavailable");
      removed.push(id);
      return { result: "ok" };
    });
    const { drainImageCleanup } = require("../dist/services/image.service.js");
    const png = await sharp({ create: { width: 4, height: 4, channels: 3, background: "red" } }).png().toBuffer();
    const form = (primary, thumbnails = [], fields = {}) => {
      const body = new FormData();
      if (primary) body.append("primaryImage", new Blob([primary], { type: "image/png" }), "primary.png");
      for (const buffer of thumbnails) body.append("thumbnails", new Blob([buffer], { type: "image/png" }), "thumb.png");
      for (const [key, value] of Object.entries(fields)) body.append(key, value);
      return body;
    };
    server = require("../dist/app.js").default.listen(0, "127.0.0.1");
    await once(server, "listening");
    const base = `http://127.0.0.1:${server.address().port}/api/product-images`;
    const request = async (path, method, body, token = adminToken) => {
      const isForm = body instanceof FormData;
      const response = await fetch(base + path, { method, headers: {
        ...(token ? { Authorization: "Bearer " + token } : {}), ...(!isForm && body ? { "Content-Type": "application/json" } : {}),
      }, ...(body ? { body: isForm ? body : JSON.stringify(body) } : {}) });
      return { status: response.status, body: await response.json() };
    };
    let image;
    await t.test("unauthorized uploads, bad targets and invalid content never reach provider", async () => {
      assert.equal((await request("/" + product._id, "POST", form(png), null)).status, 401);
      assert.equal((await request("/" + product._id, "POST", form(png), customerToken)).status, 403);
      assert.equal((await request("/bad-id", "POST", form(png))).status, 400);
      assert.equal((await request("/aaaaaaaaaaaaaaaaaaaaaaaa", "POST", form(png))).status, 404);
      assert.equal((await request("/" + product._id, "POST", form(Buffer.from("not a PNG")))).status, 400);
      const wide = await sharp({ create: { width: 9000, height: 1, channels: 3, background: "red" } }).png().toBuffer();
      assert.equal((await request("/" + product._id, "POST", form(wide))).status, 400);
      assert.equal((await request("/" + product._id, "POST", form(Buffer.alloc(5 * 1024 * 1024 + 1)))).status, 413);
      assert.equal((await request("/" + product._id, "POST", form(png, Array(6).fill(png)))).status, 400);
      assert.equal(upload.mock.callCount(), 0);
    });
    await t.test("create and public read; duplicate creation is rejected before upload", async () => {
      const created = await request("/" + product._id, "POST", form(png, [png, png]));
      assert.equal(created.status, 201, JSON.stringify(created.body));
      image = created.body.data;
      assert.equal(image.thumbnails.length, 2);
      const before = upload.mock.callCount();
      assert.equal((await request("/" + product._id, "POST", form(png))).status, 409);
      assert.equal(upload.mock.callCount(), before);
      assert.equal((await request("/" + product._id, "GET", undefined, null)).status, 200);
    });
    await t.test("primary update succeeds and shared old assets are not deleted", async () => {
      const shared = image.primaryPublicId;
      await Image.create({ product: otherProduct._id, primaryImage: image.primaryImage, primaryPublicId: shared });
      const response = await request("/" + image._id, "PATCH", form(png));
      assert.equal(response.status, 200);
      image = response.body.data;
      assert.ok(!removed.includes(shared));
    });
    await t.test("single/all thumbnail replacements and deletion work", async () => {
      const previous = image.thumbnails[0].publicId;
      let response = await request("/" + image._id + "/thumbnails", "PATCH", form(null, [png], { mode: "single", publicId: previous }));
      assert.equal(response.status, 200);
      assert.ok(removed.includes(previous));
      response = await request("/" + image._id + "/thumbnails", "PATCH", form(null, [png, png, png], { mode: "all" }));
      assert.equal(response.status, 200);
      assert.equal(response.body.data.thumbnails.length, 3);
      image = response.body.data;
      response = await request("/" + image._id + "/thumbnail", "DELETE", { mode: "single", publicId: image.thumbnails[0].publicId });
      assert.equal(response.status, 200);
      assert.equal(response.body.data.thumbnails.length, 2);
      response = await request("/" + image._id + "/thumbnail", "DELETE", { mode: "all" });
      assert.equal(response.status, 200);
      assert.equal(response.body.data.thumbnails.length, 0);
    });
    await t.test("database save failure preserves old image and journals new orphan", async () => {
      const old = await Image.findById(image._id);
      const original = Image.prototype.save;
      const save = mock.method(Image.prototype, "save", async function (...args) {
        if (String(this._id) === image._id) throw new Error("database failed");
        return original.apply(this, args);
      });
      const response = await request("/" + image._id, "PATCH", form(png));
      save.mock.restore();
      assert.equal(response.status, 500);
      assert.equal((await Image.findById(image._id)).primaryPublicId, old.primaryPublicId);
      assert.ok(await Asset.exists({ state: "cleanup" }));
      await Asset.updateMany({ state: "cleanup" }, { $set: { retryAfter: new Date(0) } });
      await drainImageCleanup();
      assert.ok(!removed.includes(old.primaryPublicId));
    });
    await t.test("partial provider failure leaves no DB image and cleanup is recoverable", async () => {
      const entry = await Product.create({ name: "Failed", slug: "failed", category: category._id, brand: brand._id });
      failUploadAt = uploadNumber + 2;
      const response = await request("/" + entry._id, "POST", form(png, [png]));
      failUploadAt = -1;
      assert.equal(response.status, 502);
      assert.equal(await Image.countDocuments({ product: entry._id }), 0);
      await Asset.updateMany({ state: "cleanup" }, { $set: { retryAfter: new Date(0) } });
      await drainImageCleanup();
      assert.equal(await Asset.countDocuments({ state: "cleanup" }), 0);
    });
    await t.test("provider deletion failure is durably retried after DB commit", async () => {
      failDestroy = true;
      const response = await request("/" + image._id, "DELETE");
      assert.equal(response.status, 200);
      assert.equal((await Image.findById(image._id)).primaryPublicId, "");
      assert.ok(await Asset.exists({ state: "cleanup", attempts: { $gt: 0 } }));
      failDestroy = false;
      await Asset.updateMany({ state: "cleanup" }, { $set: { retryAfter: new Date(0) } });
      await drainImageCleanup();
      assert.equal(await Asset.countDocuments({ state: "cleanup" }), 0);
    });
    await t.test("optimistic concurrency rejects stale mutations", async () => {
      const first = await Image.findById(image._id);
      const stale = await Image.findById(image._id);
      first.primaryImage = "https://example.test/first";
      await first.save();
      stale.primaryImage = "https://example.test/stale";
      await assert.rejects(stale.save(), { name: "VersionError" });
    });
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    mock.restoreAll();
    await db.stop();
  }
});
