import mongoose, { Schema } from "mongoose";

const sessionSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  refreshHash: { type: String, required: true, select: false },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  revokedAt: { type: Date, default: null },
}, { timestamps: true });

export default mongoose.model("Session", sessionSchema);
