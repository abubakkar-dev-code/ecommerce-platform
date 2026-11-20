import mongoose, { Schema, Types } from "mongoose";

const productVarientSchema = new Schema(
  {
    product: {
      type: Types.ObjectId,
      ref: "Product",
      required: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      maxLength: 80,
    },
    attributes: {
      type: Map,
      of: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    comparedAt: {
      type: Number,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);
productVarientSchema.index({ product: 1, isActive: 1, price: 1 });
const Varient = mongoose.model("Varient", productVarientSchema);
export default Varient;
