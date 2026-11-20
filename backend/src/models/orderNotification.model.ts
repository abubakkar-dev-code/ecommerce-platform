import mongoose, { Schema } from "mongoose";

const schema = new Schema({
  _id: { type: String, required: true },
  order: { type: Schema.Types.ObjectId, ref: "Order", required: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["cod_confirmed", "confirmed", "payment_review", "cancelled"], required: true },
  status: { type: String, enum: ["pending", "sent", "skipped", "failed"], default: "pending" },
  attempts: { type: Number, default: 0 },
  nextAttemptAt: { type: Date, default: Date.now },
  leaseUntil: Date,
  leaseId: String,
}, { timestamps: true });

schema.index({ status: 1, nextAttemptAt: 1 });
export default mongoose.model("OrderNotification", schema);
