const assert = require("node:assert/strict");
const { once } = require("node:events");
const { test, mock } = require("node:test");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");
const { startIsolatedMongo } = require("./helpers/isolated-mongo.cjs");

test("C3 transactional inventory and checkout on an isolated replica set", async (t) => {
  const db = await startIsolatedMongo({ replicaSet: true });
  let server;
  try {
    for (const key of ["JWT_SECRET", "CLIENT_ID", "CLIENT_SECRET", "MAIL_HOST", "MAIL_USER", "MAIL_PASSWORD", "MAIL_FROM",
      "CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET", "RAZOR_PAY_KEY", "RAZOR_PAY_SECRET"]) process.env[key] = "stock-test-only";
    process.env.RAZOR_PAY_KEY = "rzp_test_integration_fixture";
    process.env.NODE_ENV = "test";
    process.env.MONGODB_URI = db.uri;
    process.env.JWT_EXPIRES_IN = "1h";
    process.env.CLIENT_CALLBACK_URI = "http://127.0.0.1/google/callback";
    process.env.MAIL_PORT = "2525";
    const User = require("../dist/models/user.model.js").default;
    const Product = require("../dist/models/product.model.js").default;
    const Variant = require("../dist/models/productVariant.model.js").default;
    const Brand = require("../dist/models/brand.model.js").default;
    const Category = require("../dist/models/category.model.js").default;
    const { Inventory } = require("../dist/models/Inventory.model.js");
    const Reservation = require("../dist/models/stockReservation.model.js").default;
    const Adjustment = require("../dist/models/inventoryAdjustment.model.js").default;
    const Order = require("../dist/models/order.model.js").default;
    const Cart = require("../dist/models/cart.model.js").default;
    const Address = require("../dist/models/address.model.js").default;
    const Payment = require("../dist/models/payment.model.js").default;
    const provider = require("../dist/config/razorpay.config.js").default;
    mock.method(provider.payments, "fetch", async (id) => ({
      id, order_id: id === "rp_payment_late" ? "rp_order_late" : "rp_order_1",
      amount: id === "rp_payment_wrong_amount" ? 1 : 14900,
      currency: "INR", status: id === "rp_payment_authorized" ? "authorized" : "captured",
    }));
    const createProvider = mock.method(provider.orders, "create", async ({ amount }) => ({ id: "rp_order_created", amount, currency: "INR" }));
    await Promise.all([User, Product, Variant, Brand, Category, Inventory, Reservation, Adjustment, Order, Cart, Address, Payment].map((model) => model.init()));
    const user = await User.create({ name: "Customer", email: "customer@example.test" });
    const admin = await User.create({ name: "Admin", email: "admin@example.test", role: "admin" });
    const brand = await Brand.create({ name: "Brand", slug: "brand" });
    const category = await Category.create({ name: "Category", slug: "category" });
    const product = await Product.create({ name: "Product", slug: "product", category: category._id, brand: brand._id });
    const a = await Variant.create({ product: product._id, sku: "A", attributes: { size: "M" }, price: 100 });
    const b = await Variant.create({ product: product._id, sku: "B", attributes: { size: "L" }, price: 200 });
    const inventory = await Inventory.create({ varient: a._id, quantity: 1 });
    await Inventory.create({ varient: b._id, quantity: 0 });
    const { stockTransaction, reserveStock, releaseStock, confirmStock, expireReservations } = require("../dist/services/inventory.service.js");
    const orderId = () => new mongoose.Types.ObjectId();
    const reserve = (id, items = [{ varient: a._id, quantity: 1 }]) => stockTransaction((session) => reserveStock(id, String(user._id), items, session));
    const reset = async (quantity = 1) => {
      await Reservation.deleteMany({});
      await Inventory.updateMany({}, { $set: { reservedQuantity: 0, quantity: 0 } });
      await Inventory.updateOne({ _id: inventory._id }, { $set: { quantity } });
    };
    await t.test("last-unit checkout contention permits one reservation", async () => {
      const results = await Promise.allSettled(Array.from({ length: 8 }, () => reserve(orderId())));
      assert.equal(results.filter((entry) => entry.status === "fulfilled").length, 1);
      const stock = await Inventory.findById(inventory._id);
      assert.equal(stock.quantity, 1);
      assert.equal(stock.reservedQuantity, 1);
    });
    await t.test("multi-item allocation rolls back on insufficient stock or transaction failure", async () => {
      await reset();
      await assert.rejects(reserve(orderId(), [{ varient: a._id, quantity: 1 }, { varient: b._id, quantity: 1 }]));
      assert.equal((await Inventory.findById(inventory._id)).reservedQuantity, 0);
      await assert.rejects(stockTransaction(async (session) => { await reserveStock(orderId(), String(user._id), [{ varient: a._id, quantity: 1 }], session); throw new Error("rollback"); }));
      assert.equal((await Inventory.findById(inventory._id)).reservedQuantity, 0);
      assert.equal(await Reservation.countDocuments({}), 0);
    });
    await t.test("expiry and repeated release restore available stock exactly once", async () => {
      await reset();
      const id = orderId();
      await reserve(id);
      await Reservation.updateOne({ order: id }, { $set: { expiresAt: new Date(0) } });
      await expireReservations();
      await expireReservations();
      assert.equal((await Inventory.findById(inventory._id)).reservedQuantity, 0);
      assert.equal((await Reservation.findOne({ order: id })).status, "expired");
      assert.equal(await stockTransaction((session) => confirmStock(id, session)), "review");
      assert.equal((await Inventory.findById(inventory._id)).quantity, 1);
    });
    await t.test("concurrent confirmation consumes once; cancellation restores once", async () => {
      await reset(5);
      const id = orderId();
      await reserve(id, [{ varient: a._id, quantity: 2 }]);
      const outcomes = await Promise.all([1, 2].map(() => stockTransaction((session) => confirmStock(id, session))));
      assert.deepEqual(outcomes.sort(), ["already-confirmed", "confirmed"]);
      assert.equal((await Inventory.findById(inventory._id)).quantity, 3);
      await stockTransaction((session) => releaseStock(id, "cancelled", session, true));
      await stockTransaction((session) => releaseStock(id, "cancelled", session, true));
      assert.equal((await Inventory.findById(inventory._id)).quantity, 5);
      assert.equal((await Inventory.findById(inventory._id)).reservedQuantity, 0);
    });
    await t.test("verified payment-failure release is idempotent", async () => {
      await reset();
      const id = orderId();
      await reserve(id);
      assert.equal(await stockTransaction((session) => releaseStock(id, "payment_failed", session)), true);
      assert.equal(await stockTransaction((session) => releaseStock(id, "payment_failed", session)), false);
      assert.equal((await Inventory.findById(inventory._id)).reservedQuantity, 0);
    });

    server = require("../dist/app.js").default.listen(0, "127.0.0.1");
    await once(server, "listening");
    const base = `http://127.0.0.1:${server.address().port}/api`;
    const tokens = { user: jwt.sign({ userId: String(user._id) }, process.env.JWT_SECRET), admin: jwt.sign({ userId: String(admin._id) }, process.env.JWT_SECRET) };
    const call = async (path, method = "GET", body, token, headers = {}) => {
      const response = await fetch(base + path, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}), ...headers }, ...(body ? { body: JSON.stringify(body) } : {}) });
      return { status: response.status, body: await response.json() };
    };
    await t.test("inventory invariants, zero adjustments, audit and private admin details", async () => {
      await reset(2);
      const id = orderId();
      await reserve(id);
      assert.equal((await call("/inventories/" + inventory._id)).status, 401);
      assert.equal((await call("/inventories/" + inventory._id, "GET", undefined, tokens.user)).status, 403);
      assert.equal((await call("/inventories/" + inventory._id, "GET", undefined, tokens.admin)).status, 200);
      assert.equal((await call("/admin/inventory", "GET", undefined, tokens.user)).status, 403);
      const listing = await call("/admin/inventory?varient=" + a._id, "GET", undefined, tokens.admin);
      assert.equal(listing.body.data[0].varient.sku, a.sku);
      assert.deepEqual(Object.keys((await call("/inventories/varient/" + a._id)).body.data).sort(), ["inStock", "varient"]);
      assert.equal((await call("/inventories/" + inventory._id, "PATCH", { quantity: 0 }, tokens.admin)).status, 409);
      assert.equal((await call("/inventories/" + inventory._id, "PATCH", { reservedQuantity: 0 }, tokens.admin)).status, 400);
      assert.equal((await call("/inventories/" + inventory._id, "DELETE", undefined, tokens.admin)).status, 409);
      await stockTransaction((session) => releaseStock(id, "cancelled", session));
      assert.equal((await call("/inventories/" + inventory._id, "PATCH", { quantity: 0, lowStockThreshold: 0 }, tokens.admin)).status, 200);
      const current = await Inventory.findById(inventory._id);
      assert.equal(current.quantity, 0);
      assert.equal(current.lowStockThreshold, 0);
      assert.equal(await Adjustment.countDocuments({ inventory: inventory._id }), 1);
    });
    await t.test("address validation and default changes are scoped to the account", async () => {
      const sample = { fullName: "Example", phone: "+91 1234567890", addressLine1: "Street", addressLine2: "Floor 2", city: "City", state: "State", pincode: "600001", country: "India" };
      assert.equal((await call("/address", "POST", { ...sample, phone: "words" }, tokens.admin)).status, 400);
      const first = await call("/address", "POST", sample, tokens.admin);
      const second = await call("/address", "POST", { ...sample, addressLine1: "Other street", isDefault: true }, tokens.admin);
      assert.equal(first.status, 201);
      assert.equal(second.status, 201, JSON.stringify(second.body));
      assert.equal(first.body.data.addressLine2, "Floor 2");
      assert.equal(await Address.countDocuments({ user: admin._id, isDefault: true }), 1);
      assert.equal((await call("/address/" + second.body.data._id, "PATCH", { city: "New City" }, tokens.user)).status, 404);
      assert.equal((await call("/address/" + second.body.data._id, "DELETE", undefined, tokens.admin)).status, 200);
      assert.equal(String((await Address.findOne({ user: admin._id, isDefault: true }))._id), first.body.data._id);
    });
    await t.test("verification links use a fragment, confirm the current address, and reject replay", async () => {
      let sentLink;
      mock.method(require("../dist/services/sendmail.js"), "verificationEmail", async (_email, link) => { sentLink = link; });
      assert.equal((await call("/users/email-verification", "POST", {}, tokens.user)).status, 200);
      const url = new URL(sentLink);
      assert.equal(url.search, "");
      const token = new URLSearchParams(url.hash.slice(1)).get("token");
      const result = await call("/users/verify-email", "POST", { token });
      assert.equal(result.status, 200);
      assert.equal(result.body.data.emailVerified, true);
      assert.equal((await call("/users/verify-email", "POST", { token })).status, 400);
    });
    await t.test("legacy null reservations use the same stock rules for availability and reservation", async () => {
      await reset(2);
      await Inventory.collection.updateOne({ _id: inventory._id }, { $set: { reservedQuantity: null } });
      const stockUrl = "/inventories/varient/" + a._id;
      assert.equal((await call(stockUrl)).body.data.inStock, true);
      assert.equal((await call(stockUrl + "?quantity=3")).body.data.inStock, false);
      assert.equal((await call(stockUrl + "?quantity=0")).status, 400);
      const noInventory = await Variant.create({ product: product._id, sku: "NO-INVENTORY", attributes: { size: "S" }, price: 100 });
      assert.equal((await call("/inventories/varient/" + noInventory._id)).status, 404);
      assert.equal((await call("/cart/" + product._id + "/" + noInventory._id, "POST", { quantity: 1 }, tokens.user)).status, 404);
      const reservationOrder = orderId();
      await reserve(reservationOrder);
      assert.equal((await Inventory.findById(inventory._id)).reservedQuantity, 1);
      assert.equal((await call(stockUrl + "?quantity=2")).body.data.inStock, false);
      await stockTransaction((session) => releaseStock(reservationOrder, "cancelled", session));
      assert.equal((await Inventory.findById(inventory._id)).reservedQuantity, 0);
    });
    const address = await Address.create({ user: user._id, fullName: "Customer", phone: "1234567890", addressLine1: "Street", city: "City", state: "State", pincode: "600001", country: "India" });
    const added = await call("/cart/" + product._id + "/" + a._id, "POST", { quantity: 1 }, tokens.user);
    assert.equal(added.status, 201, JSON.stringify(added.body));
    const cart = await Cart.findOne({ user: user._id });
    await Cart.updateOne({ _id: cart._id }, { $set: { "items.0.price": 1 } });
    let order;
    await t.test("order creation owns address, reprices and reserves transactionally; cancellation releases", async () => {
      await reset(3);
      assert.equal((await call("/orders", "POST", { addressId: "bad" }, tokens.user)).status, 400);
      assert.equal((await call("/orders", "POST", { addressId: String(address._id) }, tokens.admin)).status, 400); // Admin has no customer cart.
      const headers = { "Idempotency-Key": "checkout-test-idempotency-1" };
      const attempts = await Promise.all([1, 2].map(() => call("/orders", "POST", { addressId: String(address._id) }, tokens.user, headers)));
      assert.deepEqual(attempts.map((entry) => entry.status).sort(), [200, 201]);
      const response = attempts.find((entry) => entry.status === 201);
      assert.equal(attempts[0].body.data._id, attempts[1].body.data._id);
      order = response.body.data;
      assert.equal((await call("/cart", "GET", undefined, tokens.user)).body.data.totalAmount, 100);
      assert.equal(order.subtotal, 100);
      assert.equal(order.shippingCharge, 49);
      assert.equal(order.totalAmount, 149);
      assert.equal((await Inventory.findById(inventory._id)).reservedQuantity, 1);
      const expires = (await Reservation.findOne({ order: order._id })).expiresAt.getTime();
      assert.ok(expires > Date.now() + 14 * 60 * 1000 && expires <= Date.now() + 15 * 60 * 1000);
      assert.equal((await call("/orders/" + order._id, "PATCH", {}, tokens.admin)).status, 404);
      assert.equal((await call("/orders/" + order._id, "PATCH", {}, tokens.user)).status, 200);
      assert.equal((await call("/orders/" + order._id, "PATCH", {}, tokens.user)).status, 200);
      assert.equal((await Inventory.findById(inventory._id)).reservedQuantity, 0);
    });
    await t.test("test payment creation is gated and reuses the same provider order", async () => {
      delete process.env.RAZORPAY_TEST_CHECKOUT;
      await reset(3);
      const response = await call("/orders", "POST", { addressId: String(address._id) }, tokens.user);
      assert.equal(response.status, 201);
      const input = { orderId: response.body.data._id };
      assert.equal((await call("/payment", "POST", input, tokens.user)).status, 503);
      process.env.RAZORPAY_TEST_CHECKOUT = "true";
      const first = await call("/payment", "POST", input, tokens.user);
      const retry = await call("/payment", "POST", input, tokens.user);
      assert.equal(first.status, 201);
      assert.equal(retry.body.data.razorpayOrderId, first.body.data.razorpayOrderId);
      assert.equal(createProvider.mock.callCount(), 1);
      delete process.env.RAZORPAY_TEST_CHECKOUT;
    });
    await t.test("payment confirmation consumes reservation once and preserves newer cart quantities", async () => {
      await reset(3);
      const response = await call("/orders", "POST", { addressId: String(address._id) }, tokens.user);
      assert.equal(response.status, 201);
      order = response.body.data;
      await Cart.updateOne({ _id: cart._id }, { $set: { "items.0.quantity": 2 } });
      await Payment.create({ user: user._id, order: order._id, razorpayOrderId: "rp_order_1", amount: order.totalAmount });
      const body = { razorpay_order_id: "rp_order_1", razorpay_payment_id: "rp_payment_1", razorpay_signature: crypto.createHmac("sha256", process.env.RAZOR_PAY_SECRET).update("rp_order_1|rp_payment_1").digest("hex") };
      for (const id of ["rp_payment_authorized", "rp_payment_wrong_amount"]) {
        const invalid = { ...body, razorpay_payment_id: id,
          razorpay_signature: crypto.createHmac("sha256", process.env.RAZOR_PAY_SECRET).update("rp_order_1|" + id).digest("hex") };
        assert.equal((await call("/payment/verify", "POST", invalid, tokens.user)).status, 409);
      }
      assert.equal((await Inventory.findById(inventory._id)).reservedQuantity, 1);
      const results = await Promise.all([1, 2].map(() => call("/payment/verify", "POST", body, tokens.user)));
      assert.ok(results.every((entry) => entry.status === 200));
      assert.equal((await Inventory.findById(inventory._id)).quantity, 2);
      assert.equal((await Inventory.findById(inventory._id)).reservedQuantity, 0);
      assert.equal((await Cart.findById(cart._id)).items[0].quantity, 1);
      assert.equal((await call("/payment/verify", "POST", { ...body, razorpay_signature: "invalid" }, tokens.user)).status, 400);
      assert.equal((await Payment.findOne({ razorpayOrderId: "rp_order_1" })).status, "paid");
      assert.equal((await call("/orders/" + order._id, "PATCH", {}, tokens.user)).status, 409);
      assert.equal((await Order.findById(order._id)).orderStatus, "confirmed");
      assert.equal((await Inventory.findById(inventory._id)).quantity, 2);
    });
    await t.test("late paid callback enters review without stock deduction", async () => {
      await reset(2);
      const response = await call("/orders", "POST", { addressId: String(address._id) }, tokens.user);
      assert.equal(response.status, 201);
      order = response.body.data;
      await Reservation.updateOne({ order: order._id }, { $set: { expiresAt: new Date(0) } });
      await Payment.create({ user: user._id, order: order._id, razorpayOrderId: "rp_order_late", amount: order.totalAmount });
      const body = { razorpay_order_id: "rp_order_late", razorpay_payment_id: "rp_payment_late", razorpay_signature: crypto.createHmac("sha256", process.env.RAZOR_PAY_SECRET).update("rp_order_late|rp_payment_late").digest("hex") };
      const result = await call("/payment/verify", "POST", body, tokens.user);
      assert.equal(result.status, 200);
      assert.equal(result.body.data.order.orderStatus, "payment_review");
      assert.equal((await Inventory.findById(inventory._id)).quantity, 2);
      assert.equal((await Inventory.findById(inventory._id)).reservedQuantity, 0);
    });
    await t.test("signed captured webhook is idempotent and unsigned calls fail", async () => {
      process.env.RAZORPAY_WEBHOOK_SECRET = "webhook-fixture-only";
      process.env.ORDER_EMAIL_ENABLED = "true";
      await reset(2);
      const response = await call("/orders", "POST", { addressId: String(address._id) }, tokens.user);
      assert.equal(response.status, 201);
      const current = response.body.data;
      await Payment.create({ user: user._id, order: current._id, razorpayOrderId: "rp_order_webhook", amount: current.totalAmount });
      const body = JSON.stringify({event:"payment.captured", payload:{payment:{entity:{
        id:"rp_payment_webhook", order_id:"rp_order_webhook", amount:14900, status:"captured", currency:"INR",
      }}}});
      const signature = crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET).update(body).digest("hex");
      const deliver = (value) => fetch(base + "/payment/webhook", { method:"POST", body, headers:{
        "Content-Type":"application/json", "X-Razorpay-Signature":value, "X-Razorpay-Event-Id":"event-captured-1",
      } });
      assert.equal((await deliver("invalid")).status, 400);
      const failedBody = JSON.stringify({ event:"payment.failed", payload:{ payment:{ entity:{
        id:"rp_payment_failed", order_id:"rp_order_webhook", status:"failed",
      } } } });
      const failedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET).update(failedBody).digest("hex");
      const failed = await fetch(base + "/payment/webhook", { method:"POST", body:failedBody, headers:{
        "Content-Type":"application/json", "X-Razorpay-Signature":failedSignature, "X-Razorpay-Event-Id":"event-failed-1",
      } });
      assert.equal(failed.status, 204);
      assert.equal((await Order.findById(current._id)).orderStatus, "pending");
      assert.equal((await Inventory.findById(inventory._id)).reservedQuantity, 1);
      assert.equal((await deliver(signature)).status, 204);
      assert.equal((await deliver(signature)).status, 204);
      assert.equal((await Inventory.findById(inventory._id)).quantity, 1);
      assert.equal(await require("../dist/models/paymentEvent.model.js").default.countDocuments({ kind: "captured" }), 1);
      assert.equal(await require("../dist/models/paymentEvent.model.js").default.countDocuments({ kind: "failed" }), 1);
      const notifications = require("../dist/models/orderNotification.model.js").default;
      assert.equal(await notifications.countDocuments({ order: current._id, type: "confirmed" }), 1);
      const { drainOrderNotifications } = require("../dist/services/orderNotification.service.js");
      let attempts = 0;
      mock.method(require("../dist/config/email.js").default, "sendMail", async () => {
        if (++attempts === 1) throw new Error("Temporary SMTP fixture failure");
      });
      await drainOrderNotifications();
      assert.equal((await notifications.findOne({ order: current._id })).status, "pending");
      await notifications.updateOne({ order: current._id }, { $set: { nextAttemptAt: new Date(0) } });
      await Promise.all([drainOrderNotifications(), drainOrderNotifications()]);
      assert.equal((await notifications.findOne({ order: current._id })).status, "sent");
      assert.equal(attempts, 2);
      delete process.env.ORDER_EMAIL_ENABLED;
      assert.equal((await call("/admin/orders", "GET", undefined, tokens.user)).status, 403);
      assert.equal((await call("/admin/orders?status=confirmed", "GET", undefined, tokens.admin)).status, 200);
      const fulfillment = "/admin/orders/" + current._id + "/fulfillment";
      assert.equal((await call(fulfillment, "PATCH", { status: "delivered" }, tokens.admin)).status, 409);
      assert.equal((await call(fulfillment, "PATCH", { status: "processing" }, tokens.admin)).status, 200);
      assert.equal((await call(fulfillment, "PATCH", { status: "shipped" }, tokens.admin)).status, 200);
      const metrics = await call("/admin/dashboard", "GET", undefined, tokens.admin);
      assert.equal(metrics.status, 200);
      assert.equal(metrics.body.data.activeProducts, 1);
      assert.equal(metrics.body.data.paidOrderTotal, 298);
    });
    await t.test("Buy Now deduplicates a single-variant checkout and confirmation preserves the whole cart", async () => {
      await reset(3);
      await Cart.updateOne({ user: user._id }, { $set: { items: [
        { product: product._id, varient: a._id, quantity: 2, price: 100 },
        { product: product._id, varient: b._id, quantity: 1, price: 200 },
      ] } });
      const before = (await Cart.findOne({ user: user._id })).toObject().items;
      const headers = { "Idempotency-Key": "buy-now-order-fixture-001" };
      const input = { addressId: String(address._id), buyNow: { productId: String(product._id), variantId: String(a._id), quantity: 1 } };
      const first = await call("/orders", "POST", input, tokens.user, headers);
      assert.equal(first.status, 201, JSON.stringify(first.body));
      const direct = first.body.data;
      assert.equal(direct.items.length, 1);
      assert.equal(direct.items[0].quantity, 1);
      assert.equal(direct.items[0].sku, a.sku);
      const replay = await call("/orders", "POST", input, tokens.user, headers);
      assert.equal(replay.status, 200);
      assert.equal(replay.body.data._id, direct._id);
      assert.equal((await call("/orders", "POST", { ...input, buyNow: { ...input.buyNow, quantity: 2 } }, tokens.user, headers)).status, 409);
      assert.equal((await call("/orders", "POST", { ...input, buyNow: { ...input.buyNow, quantity: 4 } }, tokens.user,
        { "Idempotency-Key": "buy-now-insufficient-001" })).status, 400);
      const pending = await Inventory.findById(inventory._id);
      assert.equal(pending.reservedQuantity, 1);
      await Payment.create({ user: user._id, order: direct._id, razorpayOrderId: "rp_order_buy_now", amount: direct.totalAmount });
      const payload = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: {
        id: "rp_payment_buy_now", order_id: "rp_order_buy_now", amount: 14900, status: "captured", currency: "INR",
      } } } });
      const signature = crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET).update(payload).digest("hex");
      for (let attempt = 0; attempt < 2; attempt++) {
        const response = await fetch(base + "/payment/webhook", { method: "POST", body: payload, headers: {
          "Content-Type": "application/json", "X-Razorpay-Signature": signature, "X-Razorpay-Event-Id": "event-buy-now-1",
        } });
        assert.equal(response.status, 204);
      }
      assert.deepEqual((await Cart.findOne({ user: user._id })).toObject().items, before);
      assert.equal((await Order.findById(direct._id)).orderStatus, "confirmed");
      assert.equal((await Inventory.findById(inventory._id)).quantity, 2);
    });
    await t.test("Cash on Delivery commits stock, keeps payment pending, and supports retry, cancellation and collection", async () => {
      await reset(3);
      const body = { addressId: String(address._id), paymentMethod: "cod",
        buyNow: { productId: String(product._id), variantId: String(a._id), quantity: 1 } };
      const headers = { "Idempotency-Key": "cod-checkout-fixture-01" };
      const cartBefore = (await Cart.findOne({ user: user._id })).toObject().items;
      const created = await call("/orders", "POST", body, tokens.user, headers);
      assert.equal(created.status, 201, JSON.stringify(created.body));
      const cod = created.body.data;
      assert.equal(cod.paymentMethod, "cod");
      assert.equal(cod.paymentStatus, "pending");
      assert.equal(cod.orderStatus, "confirmed");
      assert.equal(cod.totalAmount, 149);
      const again = await call("/orders", "POST", body, tokens.user, headers);
      assert.equal(again.status, 200);
      assert.equal(again.body.data._id, cod._id);
      assert.equal((await call("/orders", "POST", { ...body, paymentMethod: "razorpay" }, tokens.user, headers)).status, 409);
      assert.equal((await Inventory.findById(inventory._id)).quantity, 2);
      assert.equal((await Inventory.findById(inventory._id)).reservedQuantity, 0);
      assert.equal(await Payment.countDocuments({ order: cod._id }), 0);
      assert.deepEqual((await Cart.findOne({ user: user._id })).toObject().items, cartBefore);
      for (let i = 0; i < 2; i++) assert.equal((await call("/orders/" + cod._id, "PATCH", {}, tokens.user)).status, 200);
      assert.equal((await Inventory.findById(inventory._id)).quantity, 3);
      await Cart.updateOne({ user: user._id }, { $set: { items: [{ product: product._id, varient: a._id, quantity: 1, price: 100 }] } });
      const fromCart = await call("/orders", "POST", { addressId: String(address._id), paymentMethod: "cod" }, tokens.user,
        { "Idempotency-Key": "cod-cart-fixture-00001" });
      assert.equal(fromCart.status, 201);
      assert.equal((await Cart.findOne({ user: user._id })).items.length, 0);
      const route = "/admin/orders/" + fromCart.body.data._id + "/fulfillment";
      assert.equal((await call(route, "PATCH", { status: "processing" }, tokens.admin)).status, 200);
      assert.equal((await call(route, "PATCH", { status: "shipped" }, tokens.admin)).status, 200);
      assert.equal((await call(route, "PATCH", { status: "delivered" }, tokens.admin)).status, 409);
      assert.equal((await call(route, "PATCH", { status: "delivered", cashReceived: true }, tokens.admin)).status, 200);
      assert.equal((await Order.findById(fromCart.body.data._id)).paymentStatus, "paid");
    });
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    mock.restoreAll();
    await db.stop();
  }
});
