import mongoose, { Schema, Document } from "mongoose";

interface IOrderItem {
  product: mongoose.Types.ObjectId;
  varient: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
  productName?: string;
  image?: string;
  sku?: string;
  attributes?: Record<string, string>;
}

interface IShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  checkoutKey?: string;
  checkoutSource?: "cart" | "buy-now";
  paymentMethod?: "razorpay" | "cod";
  checkoutAddress?: mongoose.Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  subtotal: number;
  shippingCharge: number;
  totalAmount: number;
  paymentStatus: string;
  orderStatus: string;
}

const orderItemSchema = new Schema<IOrderItem>({
  product: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  varient: {
    type: Schema.Types.ObjectId,
    ref: "Varient",
    required: true,
  },
  productName: String,
  image: String,
  sku: String,
  attributes: { type: Map, of: String },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
});

const shippingAddressSchema = new Schema<IShippingAddress>({
  fullName: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  addressLine1: {
    type: String,
    required: true,
  },
  addressLine2: {
    type: String,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  pincode: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
});

const orderSchema = new Schema<IOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    checkoutSource: { type: String, enum: ["cart", "buy-now"] },
    checkoutKey: { type: String, select: false },
    checkoutAddress: { type: Schema.Types.ObjectId, select: false },
    items: {
      type: [orderItemSchema],
      required: true,
    },

    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    shippingCharge: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentMethod: { type: String, enum: ["razorpay", "cod"], default: "razorpay" },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },

    orderStatus: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "expired",
        "payment_review",
      ],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

orderSchema.index({ user: 1, checkoutKey: 1 }, { unique: true, partialFilterExpression: { checkoutKey: { $type: "string" } } });

const Order = mongoose.model<IOrder>("Order", orderSchema);

export default Order;
