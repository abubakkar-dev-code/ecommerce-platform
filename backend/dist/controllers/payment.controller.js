"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPayment = exports.createPayment = void 0;
const api_error_1 = __importDefault(require("../utils/api-error"));
const api_response_1 = __importDefault(require("../utils/api-response"));
const order_model_1 = __importDefault(require("../models/order.model"));
const payment_model_1 = __importDefault(require("../models/payment.model"));
const razorpay_config_1 = __importDefault(require("../config/razorpay.config"));
const cart_model_1 = __importDefault(require("../models/cart.model"));
const stockReservation_model_1 = __importDefault(require("../models/stockReservation.model"));
const inventory_service_1 = require("../services/inventory.service");
const crypto_1 = __importDefault(require("crypto"));
const pricing_service_1 = require("../services/pricing.service");
const createPayment = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new api_error_1.default(401, "Unauthorized, please login");
        }
        const { orderId } = req.body;
        if (!orderId) {
            throw new api_error_1.default(400, "Order ID is required");
        }
        const order = await order_model_1.default.findOne({
            _id: orderId,
            user: userId,
        });
        if (!order) {
            throw new api_error_1.default(404, "Order not found");
        }
        if (order.paymentStatus === "paid") {
            throw new api_error_1.default(400, "Order is already paid");
        }
        if (order.orderStatus !== "pending" || !(await stockReservation_model_1.default.exists({ order: order._id, status: "active", expiresAt: { $gt: new Date() } }))) {
            throw new api_error_1.default(409, "Order reservation is unavailable; start a new checkout");
        }
        const amount = order.totalAmount;
        if (amount <= 0) {
            throw new api_error_1.default(400, "Invalid order amount");
        }
        const amountInPaise = (0, pricing_service_1.toPaise)(amount);
        const razorpayOrder = await razorpay_config_1.default.orders.create({
            amount: amountInPaise,
            currency: "INR",
            receipt: order._id.toString(),
        });
        const payment = await payment_model_1.default.create({
            user: userId,
            order: order._id,
            razorpayOrderId: razorpayOrder.id,
            amount: amount,
            currency: "INR",
            status: "created",
        });
        res.status(201).json(new api_response_1.default("Payment order created successfully", {
            paymentId: payment._id,
            orderId: order._id,
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            razorpayKeyId: process.env.RAZOR_PAY_KEY,
        }));
    }
    catch (error) {
        next(error);
    }
};
exports.createPayment = createPayment;
const verifyPayment = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new api_error_1.default(401, "Unauthorized, please login");
        }
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            throw new api_error_1.default(400, "Payment details are required");
        }
        const payment = await payment_model_1.default.findOne({
            user: userId,
            razorpayOrderId: razorpay_order_id,
        });
        if (!payment) {
            throw new api_error_1.default(404, "Payment record not found");
        }
        const order = await order_model_1.default.findOne({
            _id: payment.order,
            user: userId,
        });
        if (!order) {
            throw new api_error_1.default(404, "Order not found");
        }
        const generatedSignature = crypto_1.default
            .createHmac("sha256", process.env.RAZOR_PAY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");
        if (generatedSignature !== razorpay_signature) {
            throw new api_error_1.default(400, "Payment verification failed");
        }
        const result = await (0, inventory_service_1.stockTransaction)(async (session) => {
            const currentPayment = await payment_model_1.default.findOne({ _id: payment._id, user: userId }).session(session);
            const currentOrder = await order_model_1.default.findOne({ _id: order._id, user: userId }).session(session);
            if (!currentPayment || !currentOrder)
                throw new api_error_1.default(404, "Payment or order not found");
            if (currentPayment.status === "paid" && currentOrder.paymentStatus === "paid") {
                return { payment: currentPayment, order: currentOrder };
            }
            const stock = await (0, inventory_service_1.confirmStock)(currentOrder._id, session);
            currentPayment.razorpayPaymentId = razorpay_payment_id;
            currentPayment.razorpaySignature = razorpay_signature;
            currentPayment.status = "paid";
            currentOrder.paymentStatus = "paid";
            currentOrder.orderStatus = stock === "review" ? "payment_review" : "confirmed";
            await currentPayment.save({ session });
            await currentOrder.save({ session });
            if (stock !== "review") {
                const cart = await cart_model_1.default.findOne({ user: userId }).session(session);
                if (cart) {
                    // Remove purchased quantities only; later cart additions survive checkout.
                    for (const item of currentOrder.items) {
                        const cartItem = cart.items.find((entry) => String(entry.varient) === String(item.varient));
                        if (cartItem)
                            cartItem.quantity = Math.max(0, cartItem.quantity - item.quantity);
                    }
                    for (let i = cart.items.length - 1; i >= 0; i--) {
                        if (cart.items[i].quantity === 0)
                            cart.items.splice(i, 1);
                    }
                    await cart.save({ session });
                }
            }
            return { payment: currentPayment, order: currentOrder };
        });
        res.status(200).json(new api_response_1.default("Payment verified successfully", {
            payment: result.payment,
            order: result.order,
        }));
    }
    catch (error) {
        next(error);
    }
};
exports.verifyPayment = verifyPayment;
