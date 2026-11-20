const assert = require("node:assert/strict");
const { once } = require("node:events");
const { test } = require("node:test");
const jwt = require("jsonwebtoken");
const { startIsolatedMongo } = require("./helpers/isolated-mongo.cjs");

test("C1 real MongoDB catalog and authorization integration", async (t) => {
  const db = await startIsolatedMongo();
  let server;
  try {
    for (const key of ["JWT_SECRET", "CLIENT_ID", "CLIENT_SECRET", "MAIL_HOST", "MAIL_USER", "MAIL_PASSWORD", "MAIL_FROM",
      "CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET", "RAZOR_PAY_KEY", "RAZOR_PAY_SECRET"]) process.env[key] = "catalog-test-only";
    process.env.MONGODB_URI = db.uri;
    process.env.JWT_EXPIRES_IN = "1h";
    process.env.CLIENT_CALLBACK_URI = "http://127.0.0.1/google/callback";
    process.env.MAIL_PORT = "2525";
    const Product = require("../dist/models/product.model.js").default;
    const Variant = require("../dist/models/productVariant.model.js").default;
    const Brand = require("../dist/models/brand.model.js").default;
    const Category = require("../dist/models/category.model.js").default;
    const User = require("../dist/models/user.model.js").default;
    const Image = require("../dist/models/productImageSchema.js").default;
    // Index creation is limited to the freshly spawned isolated database.
    await Promise.all([Product, Variant, Brand, Category, User, Image].map((model) => model.init()));
    const admin = await User.create({ name: "Admin", email: "admin@example.test", role: "admin" });
    const customer = await User.create({ name: "Customer", email: "customer@example.test" });
    const adminToken = jwt.sign({ userId: String(admin._id) }, process.env.JWT_SECRET);
    const customerToken = jwt.sign({ userId: String(customer._id) }, process.env.JWT_SECRET);
    server = require("../dist/app.js").default.listen(0, "127.0.0.1");
    await once(server, "listening");
    const base = `http://127.0.0.1:${server.address().port}/api`;
    const call = async (url, method = "GET", body, token) => {
      const response = await fetch(base + url, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}) });
      return { status: response.status, body: await response.json() };
    };
    const create = async (url, body) => {
      const response = await call(url, "POST", body, adminToken);
      assert.equal(response.status, 201, JSON.stringify(response.body));
      return response.body.data;
    };
    const brand = await create("/brands/create-brand", { name: "Brand", slug: "brand" });
    const category = await create("/categories/create-category", { name: "Category", slug: "category" });
    const productBody = { name: "Product", slug: "product", category: category._id, brand: brand._id };
    const product = await create("/products/create-product", productBody);
    const variantBody = { product: product._id, sku: "sku-1", attributes: { Size: "M" }, price: 10, comparedAt: 20 };
    const variant = await create("/varients/create-varient", variantBody);

    await t.test("admin-only mutations and invalid payloads", async () => {
      assert.equal((await call("/products/create-product", "POST", productBody)).status, 401);
      assert.equal((await call("/products/create-product", "POST", productBody, customerToken)).status, 403);
      for (const body of [{ ...productBody, name: [] }, { ...productBody, brand: { $ne: null } }, { ...productBody, extra: true }]) {
        assert.equal((await call("/products/create-product", "POST", body, adminToken)).status, 400);
      }
      assert.equal((await call("/products/not-an-id")).status, 400);
      for (const price of [-1, "10", 1.234]) {
        assert.equal((await call("/varients/create-varient", "POST", { ...variantBody, price }, adminToken)).status, 400);
      }
    });
    await t.test("unique SKUs withstand concurrent creation and normalization", async () => {
      const results = await Promise.all([1, 2].map(() => call("/varients/create-varient", "POST", { ...variantBody, sku: " concurrent " }, adminToken)));
      assert.deepEqual(results.map((result) => result.status).sort(), [201, 409]);
      assert.equal(await Variant.countDocuments({ sku: "CONCURRENT" }), 1);
    });
    await t.test("variant partial updates validate effective prices and accept explicit false", async () => {
      assert.equal((await call("/varients/" + variant._id, "PATCH", { comparedAt: 9 }, adminToken)).status, 400);
      assert.equal((await call("/varients/" + variant._id, "PATCH", { price: 21 }, adminToken)).status, 400);
      assert.equal((await call("/varients/" + variant._id, "PATCH", { price: 0 }, adminToken)).status, 201);
      assert.equal((await call("/varients/" + variant._id, "PATCH", { isActive: false }, adminToken)).status, 201);
      assert.equal((await call("/varients/getSingleVarient/" + variant._id)).status, 404);
      await call("/varients/" + variant._id, "PATCH", { isActive: true, price: 10 }, adminToken);
    });
    await t.test("product updates reject broken relationships and inactive parents", async () => {
      assert.equal((await call("/products/" + product._id, "PATCH", { brand: "aaaaaaaaaaaaaaaaaaaaaaaa" }, adminToken)).status, 404);
      await call("/brands/" + brand._id, "PATCH", { isActive: false }, adminToken);
      assert.equal((await call("/products/" + product._id)).status, 404);
      assert.equal((await call("/products")).body.pagination.totalProducts, 0);
      assert.equal((await call("/varients/getSingleVarient/" + variant._id)).status, 409);
      await call("/brands/" + brand._id, "PATCH", { isActive: true }, adminToken);
    });
    await t.test("category cycles are rejected and null detaches a parent", async () => {
      const child = await create("/categories/create-category", { name: "Child", slug: "child", parentCategory: category._id });
      assert.equal((await call("/categories/" + category._id, "PATCH", { parentCategory: child._id }, adminToken)).status, 409);
      assert.equal((await call("/categories/" + child._id, "PATCH", { parentCategory: null }, adminToken)).status, 201);
      assert.equal((await Category.findById(child._id)).parentCategory, null);
    });
    await t.test("literal search, bounded pagination, filters and stable sorting", async () => {
      for (let i = 0; i < 12; i++) {
        const entry = await Product.create({ ...productBody, name: "Item " + String(i).padStart(2, "0"), slug: "item-" + i });
        await Variant.create({ ...variantBody, product: entry._id, sku: "ITEM-" + i, price: i, comparedAt: 20 });
      }
      await Product.create({ ...productBody, slug: "hidden", isActive: false });
      const first = await call("/products?sort=name-asc");
      const second = await call("/products?page=2&sort=name-asc");
      assert.equal(first.status, 200);
      assert.equal(first.body.data.length, 9);
      assert.equal(first.body.pagination.totalProducts, 13);
      assert.equal(second.body.data.length, 4);
      assert.equal(new Set([...first.body.data, ...second.body.data].map((entry) => entry._id)).size, 13);
      assert.equal((await call("/products/search?search=.*")).body.data.length, 0);
      const filtered = await call("/products/filter?minPrice=2&maxPrice=4&sort=price-desc");
      assert.deepEqual(filtered.body.data.map((entry) => entry.name), ["Item 04", "Item 03", "Item 02"]);
      assert.ok(first.body.data.every((entry) => Array.isArray(entry.variants) && Array.isArray(entry.images)));
      for (const query of ["limit=101", "page=0", "page=1.5", "minPrice=9&maxPrice=1", "search=a&search=b", "brand=bad", "sort=evil"]) {
        assert.equal((await call("/products?" + query)).status, 400, query);
      }
    });
    await t.test("parent browsing includes active descendants and returns matching brands with public stock booleans", async () => {
      const child = await create("/categories/create-category", { name: "Phones", slug: "phones", parentCategory: category._id });
      const childBrand = await create("/brands/create-brand", { name: "Child Brand", slug: "child-brand" });
      const childProduct = await create("/products/create-product", {
        ...productBody, name: "Child device", slug: "child-device", category: child._id, brand: childBrand._id,
      });
      const childVariant = await create("/varients/create-varient", { ...variantBody, product: childProduct._id, sku: "CHILD-1" });
      await create("/inventories/create-inventory", { varient: childVariant._id, quantity: 2 });
      await Image.create({ product: childProduct._id, primaryImage: "https://example.test/child.jpg" });
      const scopedQuery = "/products?category=" + category._id;
      const exact = await call(scopedQuery + "&brand=" + childBrand._id);
      assert.equal(exact.body.data.length, 0);
      const included = await call(scopedQuery + "&includeSubcategories=true&brand=" + childBrand._id);
      assert.equal(included.status, 200);
      assert.deepEqual(new Set(included.body.brandIds), new Set([brand._id, childBrand._id]));
      assert.equal(included.body.data[0]._id, childProduct._id);
      const enriched = included.body.data[0];
      assert.equal(enriched.brand, childBrand._id);
      assert.equal(enriched.brandDetails.name, childBrand.name);
      assert.equal(enriched.images[0].primaryImage, "https://example.test/child.jpg");
      assert.deepEqual(enriched.variants[0].inventory, { varient: childVariant._id, inStock: true });
      const detail = await call("/products/" + childProduct._id);
      assert.equal(detail.body.data.brand._id, childBrand._id);
      assert.equal(detail.body.data.variants[0].inStock, true);
      const withoutInventory = await call("/products/" + product._id);
      assert.equal(withoutInventory.body.data.variants[0].inventory, null);
      assert.ok(!("quantity" in included.body.data[0].variants[0]));
    });
    await t.test("cart validates and persists variant quantities using available stock", async () => {
      const { Inventory } = require("../dist/models/Inventory.model.js");
      await Inventory.create({ varient: variant._id, quantity: 4, reservedQuantity: 2 });
      const addPath = "/cart/" + product._id + "/" + variant._id;
      const changePath = "/cart/" + variant._id;
      assert.equal((await call(addPath, "POST", { quantity: 1 })).status, 401);
      assert.equal((await call(addPath, "POST", { quantity: "1" }, customerToken)).status, 400);
      assert.equal((await call(addPath, "POST", { quantity: 3 }, customerToken)).status, 400);
      assert.equal((await call(addPath, "POST", { quantity: 1 }, customerToken)).status, 201);
      assert.equal((await call(changePath, "PATCH", { quantity: 2 }, customerToken)).status, 200);
      assert.equal((await call(changePath, "PATCH", { quantity: 3 }, customerToken)).status, 400);
      const cart = await call("/cart", "GET", undefined, customerToken);
      assert.equal(cart.body.data.cartItems[0].varient._id, variant._id);
      assert.equal(cart.body.data.cartItems[0].quantity, 2);
      assert.equal(cart.body.data.totalAmount, 20);
      assert.equal((await call(changePath, "DELETE", undefined, customerToken)).status, 200);
    });
    await t.test("brand/category pagination and all soft-delete paths preserve public hiding", async () => {
      assert.ok((await call("/brands")).body.pagination);
      assert.ok((await call("/categories/category")).body.pagination);
      await call("/products/" + product._id, "DELETE", undefined, adminToken);
      assert.equal((await call("/products/" + product._id)).status, 404);
      await call("/varients/" + variant._id, "DELETE", undefined, adminToken);
      assert.equal((await call("/varients/getSingleVarient/" + variant._id)).status, 404);
      await call("/categories/" + category._id, "DELETE", undefined, adminToken);
      assert.equal((await call("/categories/category")).status, 404);
      await call("/brands/" + brand._id, "DELETE", undefined, adminToken);
      assert.equal((await call("/brands/" + brand._id)).status, 404);
    });
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await db.stop();
  }
});
