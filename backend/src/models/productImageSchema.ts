import mongoose, { Schema, Document } from "mongoose";

export interface IProductImage extends Document {
  product: mongoose.Types.ObjectId;
  image: string;
  isPrimary: boolean;
  sortOrder: number;
  isActive: boolean;
}

const productImageSchema = new Schema<IProductImage>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    image: {
      type: String,
      required: true,
    },

    isPrimary: {
      type: Boolean,
      default: false,
    },

    sortOrder: {
      type: Number,
      default: 0,
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

const ProductImage = mongoose.model<IProductImage>(
  "ProductImage",
  productImageSchema,
);

export default ProductImage;