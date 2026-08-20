import mongoose, { Schema, Types } from "mongoose";
export interface IProduct extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentCategory?: Types.ObjectId | null;
  isActive: boolean;
}
const categorySchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
    },
    parentCategory: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
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
const Category = mongoose.model<IProduct>("Category", categorySchema);
export default Category;
