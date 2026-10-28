import mongoose, { Schema } from "mongoose";
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
      ref: "Products",
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
  { timestamps: true },
);

const ProductImage = mongoose.model<IproductImage>(
  "productImage",
  productImageSchema,
);

export default ProductImage;
