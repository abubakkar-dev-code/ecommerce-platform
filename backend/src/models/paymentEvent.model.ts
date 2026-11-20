import mongoose, { Schema } from "mongoose";

const eventSchema = new Schema({
  _id: { type: String, required: true },
  order: { type: Schema.Types.ObjectId, ref: "Order", required: true },
  providerPaymentId: { type: String, required: true },
  kind: { type: String, enum: ["captured", "failed"], default: "captured" },
}, { timestamps: true });

export default mongoose.model("PaymentEvent", eventSchema);
