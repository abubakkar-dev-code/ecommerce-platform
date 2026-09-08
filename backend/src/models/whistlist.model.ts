import mongoose, { Schema } from "mongoose";

const wishlistSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  products: [
    {
      type: Schema.Types.ObjectId,
      ref: "Product",
      default: [],
    },
  ],
});
const WishList = mongoose.model("WishList", wishlistSchema);
export default WishList;
