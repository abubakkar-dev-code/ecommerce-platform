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
productSchema.index({ isActive: 1, createdAt: -1, _id: 1 });
productSchema.index({ category: 1, brand: 1, isActive: 1 });
const Product = mongoose.model<IProduct>("Product", productSchema);
export default Product;
