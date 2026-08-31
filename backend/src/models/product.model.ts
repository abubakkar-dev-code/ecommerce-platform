import mongoose, { Schema } from "mongoose";
export interface IProduct {
  name: string;
  slug: string;
  description: string;
  category: mongoose.Types.ObjectId;
  brand: mongoose.Types.ObjectId;
  isActive: boolean;
}
const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    brand: {
      type: Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
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
const Product = mongoose.model<IProduct>("Product", productSchema);
export default Product;
