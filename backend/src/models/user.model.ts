import mongoose, { Document, Schema } from "mongoose";
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "customer" | "admin";
  isActive: boolean;
  googleId: string;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: false,
      minLength: 8,
    },
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  },
);
const User = mongoose.model<IUser>("User", userSchema);
export default User;
