import { Schema, model } from "mongoose";

// Durable asset journal: an upload is recorded before contacting Cloudinary.
const imageAssetSchema = new Schema({
  publicId: { type: String, required: true, unique: true },
  state: { type: String, enum: ["pending", "attached", "cleanup"], required: true },
  attempts: { type: Number, default: 0 },
  retryAfter: { type: Date, required: true },
  lockedUntil: { type: Date, default: null },
}, { timestamps: true });
imageAssetSchema.index({ state: 1, retryAfter: 1, lockedUntil: 1 });
export default model("ImageAsset", imageAssetSchema);
