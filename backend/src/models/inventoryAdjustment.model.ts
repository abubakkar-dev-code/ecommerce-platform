import { Schema, model } from "mongoose";
const schema = new Schema({
  inventory: { type: Schema.Types.ObjectId, ref: "Inventory", required: true },
  actor: { type: Schema.Types.ObjectId, ref: "User", required: true },
  previousQuantity: { type: Number, required: true },
  quantity: { type: Number, required: true },
  reason: { type: String, required: true, maxLength: 300 },
}, { timestamps: true });
schema.index({ inventory: 1, createdAt: -1 });
export default model("InventoryAdjustment", schema);
