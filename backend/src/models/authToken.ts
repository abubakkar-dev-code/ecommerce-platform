import mongoose, { Document, Schema } from "mongoose";

export interface auth extends Document {
  userId: mongoose.Types.ObjectId;
  token: String;
  expiresAt: Date;
}
const authTokenSchema = new Schema<auth>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: {
        expireAfterSeconds: 0,
      },
    },
  },
  {
    timestamps: true,
  },
);
const AuthToken = mongoose.model<auth>("AuthToken", authTokenSchema);
export default AuthToken;
