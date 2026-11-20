import type { ClientSession, Types } from "mongoose";
import Cart from "../models/cart.model";

export async function removePurchasedItems(
  userId: string | Types.ObjectId,
  items: readonly { varient: Types.ObjectId; quantity: number }[],
  session: ClientSession,
) {
  const cart = await Cart.findOne({ user: userId }).session(session);
  if (!cart) return;
  for (const item of items) {
    const line = cart.items.find((entry) => String(entry.varient) === String(item.varient));
    if (line) line.quantity = Math.max(0, line.quantity - item.quantity);
  }
  for (let index = cart.items.length - 1; index >= 0; index--) {
    if (cart.items[index]?.quantity === 0) cart.items.splice(index, 1);
  }
  await cart.save({ session });
}
