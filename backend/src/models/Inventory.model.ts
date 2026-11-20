import mongoose, { Schema, type Document } from "mongoose";
export interface IInventory extends Document {
  varient: mongoose.Types.ObjectId;
  quantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
}

const inventorySchema = new Schema<IInventory>(
  {
    varient: {
      type: Schema.Types.ObjectId,
      ref: "Varient",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      validate: Number.isSafeInteger,
    },
    reservedQuantity: {
      type: Number,
      min: 0,
      default: 0,
      validate: Number.isSafeInteger,
    },
    lowStockThreshold: {
      type: Number,
      min: 0,
      default: 5,
      validate: Number.isSafeInteger,
    },
  },
  {
    timestamps: true,
  },
);
inventorySchema.pre("validate", function () {
  if (this.reservedQuantity > this.quantity) this.invalidate("reservedQuantity", "Reserved quantity exceeds stock");
});
inventorySchema.index({ varient: 1 }, { unique: true });
export const Inventory = mongoose.model<IInventory>(
  "Inventory",
  inventorySchema,
);
