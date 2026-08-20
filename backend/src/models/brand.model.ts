import mongoose, { Schema } from "mongoose";
export interface IBrand extends Document {
  name: string;
  slug: string;
  description: string;
  logo: string;
  isActive: boolean;
}

const brandSchema = new Schema<IBrand>(
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
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    logo: {
      type: String,
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
const Brand = mongoose.model<IBrand>("Brand", brandSchema);
export default Brand;
