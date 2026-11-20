"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPaise = toPaise;
exports.priceCheckout = priceCheckout;
const api_error_1 = __importDefault(require("../utils/api-error"));
// Existing catalog/API amounts are INR. Perform arithmetic only after converting
// to integer paise; tolerate binary representation noise, not fractional paise.
function toPaise(amount) {
    const scaled = amount * 100;
    const rounded = Math.round(scaled);
    if (!Number.isFinite(amount) || amount < 0 || !Number.isSafeInteger(rounded) ||
        Math.abs(scaled - rounded) > 0.000001) {
        throw new api_error_1.default(400, "Invalid monetary amount");
    }
    return rounded;
}
function priceCheckout(items) {
    let subtotalPaise = 0;
    for (const item of items) {
        if (!Number.isSafeInteger(item.quantity) || item.quantity < 1) {
            throw new api_error_1.default(400, "Quantity must be a positive safe integer");
        }
        const line = toPaise(item.price) * item.quantity;
        if (!Number.isSafeInteger(line) || !Number.isSafeInteger(subtotalPaise + line)) {
            throw new api_error_1.default(400, "Order amount exceeds supported range");
        }
        subtotalPaise += line;
    }
    const shippingPaise = subtotalPaise < 99900 ? 4900 : 0;
    const totalPaise = subtotalPaise + shippingPaise;
    if (!Number.isSafeInteger(totalPaise))
        throw new api_error_1.default(400, "Order amount exceeds supported range");
    return { subtotal: subtotalPaise / 100, shippingCharge: shippingPaise / 100, totalAmount: totalPaise / 100 };
}
