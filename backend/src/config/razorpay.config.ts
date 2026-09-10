import Razorpay from "razorpay";
import { env } from "./env";

const razorPay = new Razorpay({
  key_id: env.RAZOR_PAY_KEY,
  key_secret: env.RAZOR_PAY_SECRET,
});
export default razorPay;
