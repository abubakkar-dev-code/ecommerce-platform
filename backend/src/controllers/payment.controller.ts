import { Request, Response, NextFunction } from "express";
import ApiError from "../utils/api-error";
import ApiResponse from "../utils/api-response";
import Order from "../models/order.model";
import Payment from "../models/payment.model";
import razorpay from "../config/razorpay.config";
import Cart from "../models/cart.model";
import { Inventory } from "../models/Inventory.model";
import crypto from "crypto";

export const createPayment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError(401, "Unauthorized, please login");
    }
    const { orderId } = req.body;
    if (!orderId) {
      throw new ApiError(400, "Order ID is required");
    }
    const order = await Order.findOne({
      _id: orderId,
      user: userId,
    });
    if (!order) {
      throw new ApiError(404, "Order not found");
    }
    if (order.paymentStatus === "paid") {
      throw new ApiError(400, "Order is already paid");
    }
    const amount = order.totalAmount;
    if (amount <= 0) {
      throw new ApiError(400, "Invalid order amount");
    }
    const amountInPaise = Math.round(amount * 100);
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: order._id.toString(),
    });
    const payment = await Payment.create({
      user: userId,
      order: order._id,
      razorpayOrderId: razorpayOrder.id,
      amount: amount,
      currency: "INR",
      status: "created",
    });
    res.status(201).json(
      new ApiResponse("Payment order created successfully", {
        paymentId: payment._id,
        orderId: order._id,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      }),
    );
  } catch (error) {
    next(error);
  }
};
export const verifyPayment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError(401, "Unauthorized, please login");
    }
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new ApiError(400, "Payment details are required");
    }
    const payment = await Payment.findOne({
      user: userId,
      razorpayOrderId: razorpay_order_id,
    });

    if (!payment) {
      throw new ApiError(404, "Payment record not found");
    }
    const order = await Order.findOne({
      _id: payment.order,
      user: userId,
    });

    if (!order) {
      throw new ApiError(404, "Order not found");
    }
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");
    if (generatedSignature !== razorpay_signature) {
      payment.status = "failed";
      await payment.save();

      throw new ApiError(400, "Payment verification failed");
    }
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.status = "paid";
    await payment.save();
    order.paymentStatus = "paid";
    order.orderStatus = "confirmed";
    await order.save();
    for (const item of order.items) {
      const inventory = await Inventory.findOne({
        varient: item.varient,
      });

      if (!inventory) {
        throw new ApiError(
          404,
          `Inventory not found for variant ${item.varient}`,
        );
      }

      if (inventory.quantity < item.quantity) {
        throw new ApiError(
          400,
          `Insufficient stock for variant ${item.varient}`,
        );
      }

      inventory.quantity -= item.quantity;

      await inventory.save();
    }
    const cart = await Cart.findOne({
      user: userId,
    });

    if (cart) {
      cart.items.splice(0, cart.items.length);
      await cart.save();
    }
    res.status(200).json(
      new ApiResponse("Payment verified successfully", {
        payment,
        order,
      }),
    );
  } catch (error) {
    next(error);
  }
};
