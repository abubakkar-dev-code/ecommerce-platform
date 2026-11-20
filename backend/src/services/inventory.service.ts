import mongoose, { type ClientSession, type Types } from "mongoose";
import { Inventory } from "../models/Inventory.model";
import Reservation from "../models/stockReservation.model";
import Order from "../models/order.model";
import ApiError from "../utils/api-error";

interface StockItem { varient: Types.ObjectId; quantity: number }
export const stockTransaction = <T>(work: (session: ClientSession) => Promise<T>): Promise<T> =>
  mongoose.connection.transaction(work, { readConcern: { level: "snapshot" }, writeConcern: { w: "majority" }, readPreference: "primary" });

export const reserveStock = async (order: Types.ObjectId, user: string, items: StockItem[], session: ClientSession) => {
  if (!items.length || items.length > 100 || items.some((item) => !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 1_000_000)) {
    throw new ApiError(400, "Invalid reservation items");
  }
  // Stable ordering reduces transaction conflicts when carts contain the same variants.
  for (const item of [...items].sort((a, b) => String(a.varient).localeCompare(String(b.varient)))) {
    const result = await Inventory.updateOne({ varient: item.varient,
      $expr: { $gte: [{ $subtract: ["$quantity", { $ifNull: ["$reservedQuantity", 0] }] }, item.quantity] } },
    [{ $set: {
      reservedQuantity: { $add: [{ $ifNull: ["$reservedQuantity", 0] }, item.quantity] },
      __v: { $add: [{ $ifNull: ["$__v", 0] }, 1] },
    } }], { session, updatePipeline: true });
    if (result.modifiedCount !== 1) throw new ApiError(409, "Insufficient available stock");
  }
  const [reservation] = await Reservation.create([{ order, user, items, expiresAt: new Date(Date.now() + 15 * 60 * 1000) }], { session });
  return reservation!;
};

export const releaseStock = async (order: Types.ObjectId | string, reason: "cancelled" | "payment_failed" | "expired", session: ClientSession, restoreConfirmed = false): Promise<boolean> => {
  const reservation = await Reservation.findOne({ order }).session(session);
  if (!reservation) return false;
  const restore = reservation.status === "confirmed" && restoreConfirmed;
  if (reservation.status !== "active" && !restore) return false;
  const changed = await Reservation.updateOne({ _id: reservation._id, status: reservation.status }, { $set: {
    status: restore ? "restored" : reason === "expired" ? "expired" : "released", closedAt: new Date(), releaseReason: reason,
  } }, { session });
  if (changed.modifiedCount !== 1) throw new ApiError(409, "Reservation changed; retry");
  for (const item of reservation.items) {
    const result = await Inventory.updateOne({ varient: item.varient, ...(restore ? {} : { reservedQuantity: { $gte: item.quantity } }) },
      { $inc: restore ? { quantity: item.quantity, __v: 1 } : { reservedQuantity: -item.quantity, __v: 1 } }, { session });
    if (result.modifiedCount !== 1) throw new ApiError(409, "Stock invariant violation; manual review required");
  }
  return true;
};

export const confirmStock = async (order: Types.ObjectId | string, session: ClientSession): Promise<"confirmed" | "already-confirmed" | "review"> => {
  const reservation = await Reservation.findOne({ order }).session(session);
  if (!reservation) return "review"; // Legacy unpaid orders are never silently allocated stock.
  if (reservation.status === "confirmed") return "already-confirmed";
  if (reservation.status !== "active") return "review";
  if (reservation.expiresAt <= new Date()) {
    await releaseStock(order, "expired", session);
    return "review";
  }
  const claimed = await Reservation.updateOne({ _id: reservation._id, status: "active", expiresAt: { $gt: new Date() } },
    { $set: { status: "confirmed", closedAt: new Date() } }, { session });
  if (claimed.modifiedCount !== 1) throw new ApiError(409, "Reservation changed; retry");
  for (const item of reservation.items) {
    const result = await Inventory.updateOne({ varient: item.varient, quantity: { $gte: item.quantity }, reservedQuantity: { $gte: item.quantity } },
      { $inc: { quantity: -item.quantity, reservedQuantity: -item.quantity, __v: 1 } }, { session });
    if (result.modifiedCount !== 1) throw new ApiError(409, "Stock invariant violation; manual review required");
  }
  return "confirmed";
};

export const expireReservations = async (): Promise<void> => {
  const reservations = await Reservation.find({ status: "active", expiresAt: { $lte: new Date() } }).select("order").limit(50).lean();
  for (const reservation of reservations) {
    await stockTransaction(async (session) => {
      const current = await Reservation.findOne({ order: reservation.order, status: "active", expiresAt: { $lte: new Date() } }).session(session);
      if (!current) return;
      await releaseStock(reservation.order, "expired", session);
      await Order.updateOne({ _id: reservation.order, paymentStatus: { $ne: "paid" }, orderStatus: "pending" },
        { $set: { orderStatus: "expired" } }, { session });
    });
  }
};
