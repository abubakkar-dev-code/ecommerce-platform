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
const Varient = mongoose.model("Variant", productVarientSchema);
export default Varient;
