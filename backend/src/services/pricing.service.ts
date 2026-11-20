import ApiError from "../utils/api-error";

// Existing catalog/API amounts are INR. Perform arithmetic only after converting
// to integer paise; tolerate binary representation noise, not fractional paise.
export function toPaise(amount: number): number {
  const scaled = amount * 100;
  const rounded = Math.round(scaled);
  if (!Number.isFinite(amount) || amount < 0 || !Number.isSafeInteger(rounded) ||
      Math.abs(scaled - rounded) > 0.000001) {
    throw new ApiError(400, "Invalid monetary amount");
  }
  return rounded;
}

export function priceCheckout(items: { price: number; quantity: number }[]) {
  let subtotalPaise = 0;
  for (const item of items) {
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1) {
      throw new ApiError(400, "Quantity must be a positive safe integer");
    }
    const line = toPaise(item.price) * item.quantity;
    if (!Number.isSafeInteger(line) || !Number.isSafeInteger(subtotalPaise + line)) {
      throw new ApiError(400, "Order amount exceeds supported range");
    }
    subtotalPaise += line;
  }
  const shippingPaise = subtotalPaise < 99900 ? 4900 : 0;
  const totalPaise = subtotalPaise + shippingPaise;
  if (!Number.isSafeInteger(totalPaise)) throw new ApiError(400, "Order amount exceeds supported range");
  return { subtotal: subtotalPaise / 100, shippingCharge: shippingPaise / 100, totalAmount: totalPaise / 100 };
}
