import mongoose, { Schema } from "mongoose";

const cartItemSchema = new Schema({
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
  quantity: {
    type: Number,
    min: 1,
    required: true,
  },
  price: {
    type: Number,
    min: 0,
    required: true,
  },
});

const cartSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: {
      type: [cartItemSchema],
      required: true,
    },
  },
  { timestamps: true },
);

const Cart = mongoose.model("Cart", cartSchema);
export default Cart;
