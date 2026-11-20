const assert = require("node:assert/strict");
const { test } = require("node:test");
const { priceCheckout, toPaise } = require("../dist/services/pricing.service.js");

test("approved shipping threshold uses exact merchandise paise", () => {
  assert.deepEqual(priceCheckout([{ price: 998.99, quantity: 1 }]), { subtotal: 998.99, shippingCharge: 49, totalAmount: 1047.99 });
  assert.deepEqual(priceCheckout([{ price: 333, quantity: 3 }]), { subtotal: 999, shippingCharge: 0, totalAmount: 999 });
  assert.equal(priceCheckout([{ price: 1000, quantity: 1 }]).shippingCharge, 0);
});

test("fractional INR arithmetic stays exact and invalid legacy prices fail closed", () => {
  assert.deepEqual(priceCheckout([{ price: 0.1, quantity: 3 }, { price: 0.2, quantity: 1 }]), { subtotal: 0.5, shippingCharge: 49, totalAmount: 49.5 });
  assert.equal(toPaise(19.99), 1999);
  for (const price of [NaN, Infinity, -1, 1.001, Number.MAX_SAFE_INTEGER]) {
    assert.throws(() => priceCheckout([{ price, quantity: 1 }]));
  }
  for (const quantity of [0, -1, 1.5, "2", NaN, Number.MAX_SAFE_INTEGER]) {
    assert.throws(() => priceCheckout([{ price: 100, quantity }]));
  }
});
