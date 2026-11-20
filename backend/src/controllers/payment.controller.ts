import type { Request, Response, NextFunction } from "express";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import ApiError from "../utils/api-error";
import ApiResponse from "../utils/api-response";
import Order from "../models/order.model";
import Payment from "../models/payment.model";
import PaymentEvent from "../models/paymentEvent.model";
import { removePurchasedItems } from "../services/checkoutCart.service";
import Reservation from "../models/stockReservation.model";
import razorpay from "../config/razorpay.config";
import { env } from "../config/env";
import { stockTransaction, confirmStock } from "../services/inventory.service";
import { toPaise } from "../services/pricing.service";
import { queueOrderNotification } from "../services/orderNotification.service";
import { objectId, parse } from "../validation/catalog.validation";

const providerId = z.string().regex(/^[a-zA-Z\d_]{3,100}$/);
const confirmation = z.object({ razorpay_order_id: providerId, razorpay_payment_id: providerId, razorpay_signature: z.string() }).strict();
const captured = z.object({ id: providerId, order_id: providerId, amount: z.number().int().nonnegative(), currency: z.literal("INR"), status: z.literal("captured") });
const capturedEvent = z.object({ payload: z.object({ payment: z.object({ entity: captured }) }) });
const failedEvent = z.object({ payload: z.object({ payment: z.object({ entity: z.object({
  id: providerId, order_id: providerId, status: z.literal("failed"),
}) }) }) });
const duplicate = (error: unknown) => !!error && typeof error === "object" && "code" in error && error.code === 11000;

function checkSignature(data: Buffer | string, signature: unknown, secret: string) {
  if (typeof signature !== "string" || !/^[a-f\d]{64}$/i.test(signature)) return false;
  return timingSafeEqual(createHmac("sha256", secret).update(data).digest(), Buffer.from(signature, "hex"));
}

export const createPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const key = env.RAZOR_PAY_KEY;
    const enabled = process.env.RAZORPAY_TEST_CHECKOUT === "true" ||
      (env.NODE_ENV === "development" && process.env.RAZORPAY_TEST_CHECKOUT !== "false");
    if (!enabled || !key?.startsWith("rzp_test_")) {
      throw new ApiError(503, "Test checkout is unavailable");
    }
    const userId = req.user!.userId!;
    const orderId = parse(objectId, req.body?.orderId);
    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) throw new ApiError(404, "Order not found");
    if (order.paymentMethod === "cod") throw new ApiError(409, "This order uses Cash on Delivery");
    if (order.orderStatus !== "pending" || order.paymentStatus !== "pending" ||
        !(await Reservation.exists({ order: order._id, status: "active", expiresAt: { $gt: new Date() } }))) {
      throw new ApiError(409, "Order reservation is unavailable");
    }
    const amount = toPaise(order.totalAmount);
    if (amount <= 0) throw new ApiError(400, "Invalid order amount");
    let payment = await Payment.findOne({ order: order._id, user: userId }).sort({ createdAt: -1 });
    if (!payment) {
      try {
        payment = await Payment.create({
          order: order._id, user: userId, amount: order.totalAmount, currency: "INR", checkoutManaged: true, status: "initializing",
        });
      } catch (error) {
        if (duplicate(error)) throw new ApiError(409, "Payment initialization is in progress. Retry shortly.");
        throw error;
      }
      try {
        const provider = await razorpay.orders.create({ amount, currency: "INR", receipt: String(order._id) });
        payment.razorpayOrderId = provider.id;
        payment.status = "created";
        await payment.save();
      } catch {
        await Payment.updateOne({ _id: payment._id, status: "initializing" }, { $set: { status: "provider_review" } });
        throw new ApiError(502, "Payment initialization requires review");
      }
    }
    if (payment.status !== "created" || !payment.razorpayOrderId || toPaise(payment.amount) !== amount) {
      throw new ApiError(409, "Payment is not ready for checkout");
    }
    res.status(201).json(new ApiResponse("Payment order ready", {
      paymentId: payment._id, orderId: order._id, razorpayOrderId: payment.razorpayOrderId,
      amount, currency: "INR", razorpayKeyId: key,
    }));
  } catch (error) { next(error); }
};

async function confirmPayment(entity: z.infer<typeof captured>, userId?: string, eventId?: string) {
  return stockTransaction(async (session) => {
    const payment = await Payment.findOne({
      razorpayOrderId: entity.order_id, ...(userId ? { user: userId } : {}),
    }).session(session);
    if (!payment) throw new ApiError(404, "Payment record not found");
    const order = await Order.findOne({ _id: payment.order, user: payment.user }).session(session);
    if (!order) throw new ApiError(404, "Order not found");
    if (order.paymentMethod === "cod") throw new ApiError(409, "This order uses Cash on Delivery");
    if (entity.amount !== toPaise(order.totalAmount) || entity.amount !== toPaise(payment.amount) || entity.currency !== payment.currency) {
      throw new ApiError(409, "Payment amount or currency does not match the order");
    }
    if (eventId && await PaymentEvent.exists({ _id: eventId }).session(session)) return { payment, order };
    if (order.paymentStatus === "refunded") throw new ApiError(409, "The order was already refunded");
    if (order.paymentStatus === "paid" && payment.razorpayPaymentId !== entity.id) {
      throw new ApiError(409, "Order already has a different captured payment");
    }
    if (order.paymentStatus !== "paid") {
      const stock = await confirmStock(order._id, session);
      payment.razorpayPaymentId = entity.id;
      payment.status = "paid";
      order.paymentStatus = "paid";
      order.orderStatus = stock === "review" ? "payment_review" : "confirmed";
      await payment.save({ session });
      await order.save({ session });
      await queueOrderNotification(order._id, payment.user, stock === "review" ? "payment_review" : "confirmed", session);
      if (stock !== "review" && order.checkoutSource !== "buy-now") {
        await removePurchasedItems(order.user, order.items, session);
      }
    }
    if (eventId) await PaymentEvent.create([{ _id: eventId, order: order._id, providerPaymentId: entity.id, kind: "captured" }], { session });
    return { payment, order };
  });
}

export const verifyPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId!;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parse(confirmation, req.body);
    const payment = await Payment.findOne({ user: userId, razorpayOrderId: razorpay_order_id }).lean();
    if (!payment?.razorpayOrderId) throw new ApiError(404, "Payment record not found");
    if (!checkSignature(`${payment.razorpayOrderId}|${razorpay_payment_id}`, razorpay_signature, env.RAZOR_PAY_SECRET!)) {
      throw new ApiError(400, "Payment verification failed");
    }
    const response = await razorpay.payments.fetch(razorpay_payment_id);
    const entity = captured.safeParse(response);
    if (!entity.success || entity.data.id !== razorpay_payment_id || entity.data.order_id !== payment.razorpayOrderId) {
      throw new ApiError(409, "Payment capture is not confirmed");
    }
    const result = await confirmPayment(entity.data, userId);
    res.json(new ApiResponse("Payment verified successfully", {
      payment: { _id: result.payment._id, status: result.payment.status }, order: result.order,
    }));
  } catch (error) { next(error); }
};

export const paymentWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) throw new ApiError(503, "Payment webhooks are not configured");
    if (!Buffer.isBuffer(req.body) || !checkSignature(req.body, req.get("X-Razorpay-Signature"), secret)) {
      throw new ApiError(400, "Invalid webhook signature");
    }
    const eventId = req.get("X-Razorpay-Event-Id");
    if (!eventId || !/^[a-zA-Z\d_-]{4,128}$/.test(eventId)) throw new ApiError(400, "Invalid webhook event identifier");
    let event: unknown;
    try { event = JSON.parse(req.body.toString("utf8")); }
    catch { throw new ApiError(400, "Invalid webhook payload"); }
    if (!event || typeof event !== "object" || !("event" in event) ||
        (event.event !== "payment.captured" && event.event !== "payment.failed")) {
      res.sendStatus(204);
      return;
    }
    if (await PaymentEvent.exists({ _id: eventId })) {
      res.sendStatus(204);
      return;
    }
    try {
      if (event.event === "payment.captured") {
        await confirmPayment(parse(capturedEvent, event).payload.payment.entity, undefined, eventId);
      } else {
        const failure = parse(failedEvent, event).payload.payment.entity;
        const payment = await Payment.findOne({ razorpayOrderId: failure.order_id }).select("order").lean();
        if (!payment) throw new ApiError(404, "Payment record not found");
        await PaymentEvent.create({ _id: eventId, order: payment.order, providerPaymentId: failure.id, kind: "failed" });
      }
    } catch (error) {
      if (!duplicate(error) || !(await PaymentEvent.exists({ _id: eventId }))) throw error;
    }
    res.sendStatus(204);
  } catch (error) { next(error); }
};
