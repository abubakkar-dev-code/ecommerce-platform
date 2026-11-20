import mongoose, { Document, Schema } from "mongoose";

interface IPayment extends Document {
  user: mongoose.Types.ObjectId;
  order: mongoose.Types.ObjectId;
  razorpayOrderId?: string;
  checkoutManaged?: boolean;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  amount: number;
  currency: string;
  status: "initializing" | "provider_review" | "created" | "paid" | "failed";
}

const paymentSchema = new Schema<IPayment>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    checkoutManaged: { type: Boolean },
    razorpayOrderId: { type: String, index: true },

    razorpayPaymentId: {
      type: String,
    },

    razorpaySignature: {
      type: String,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
    },

    status: {
      type: String,
      enum: ["initializing", "provider_review", "created", "paid", "failed"],
      default: "created",
    },
  },
  { timestamps: true },
);

paymentSchema.index({ order: 1 }, { unique: true, partialFilterExpression: { checkoutManaged: true } });

const Payment = mongoose.model<IPayment>("Payment", paymentSchema);

export default Payment;
