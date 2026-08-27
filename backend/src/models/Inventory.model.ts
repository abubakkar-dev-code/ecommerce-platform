import mongoose, { Schema} from "mongoose";
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
    },
    reservedQuantity: {
      type: Number,
      min: 0,
      default: 0,
    },
    lowStockThreshold: {
      type: Number,
      min: 0,
      default: 5,
    },
  },
  {
    timestamps: true,
  },
);
export const Inventory = mongoose.model<IInventory>(
  "Inventory",
  inventorySchema,
);
