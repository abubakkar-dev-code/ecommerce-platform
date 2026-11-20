import { Schema, model } from "mongoose";

const reservationSchema = new Schema({
  order: { type: Schema.Types.ObjectId, ref: "Order", required: true, unique: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  items: [{ varient: { type: Schema.Types.ObjectId, ref: "Varient", required: true },
    quantity: { type: Number, min: 1, required: true, validate: Number.isSafeInteger } }],
  status: { type: String, enum: ["active", "confirmed", "released", "expired", "restored"], default: "active", required: true },
  expiresAt: { type: Date, required: true },
  closedAt: { type: Date },
  releaseReason: { type: String, enum: ["cancelled", "payment_failed", "expired"] },
}, { timestamps: true });
reservationSchema.index({ status: 1, expiresAt: 1 });
reservationSchema.index({ user: 1, createdAt: -1 });
reservationSchema.index({ "items.varient": 1, status: 1 });
// Do not TTL-delete active reservations: releasing counters is a transaction.
export default model("StockReservation", reservationSchema);
