import mongoose, { Schema, type Document } from "mongoose";
interface Thumbnail {
  url: string;
  publicId: string;
}
export interface IproductImage extends Document {
  product: mongoose.Types.ObjectId;
  primaryImage: string;
  primaryPublicId: string;
  thumbnails?: Thumbnail[];
  isActive: boolean;
}
const productImageSchema = new mongoose.Schema<IproductImage>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    primaryImage: {
      type: String,
    },
    primaryPublicId: {
      type: String,
    },
    thumbnails: [
      {
        url: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
          required: true,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, optimisticConcurrency: true },
);
productImageSchema.index({ product: 1 }, { unique: true });

const ProductImage = mongoose.model<IproductImage>(
  "productImage",
  productImageSchema,
);

export default ProductImage;
