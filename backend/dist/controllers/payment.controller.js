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
const Inventory_model_1 = require("../models/Inventory.model");
const crypto_1 = __importDefault(require("crypto"));
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
        const amount = order.totalAmount;
        if (amount <= 0) {
            throw new api_error_1.default(400, "Invalid order amount");
        }
        const amountInPaise = Math.round(amount * 100);
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
            razorpayKeyId: process.env.RAZORPAY_KEY_ID,
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
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");
        if (generatedSignature !== razorpay_signature) {
            payment.status = "failed";
            await payment.save();
            throw new api_error_1.default(400, "Payment verification failed");
        }
        payment.razorpayPaymentId = razorpay_payment_id;
        payment.razorpaySignature = razorpay_signature;
        payment.status = "paid";
        await payment.save();
        order.paymentStatus = "paid";
        order.orderStatus = "confirmed";
        await order.save();
        for (const item of order.items) {
            const inventory = await Inventory_model_1.Inventory.findOne({
                varient: item.varient,
            });
            if (!inventory) {
                throw new api_error_1.default(404, `Inventory not found for variant ${item.varient}`);
            }
            if (inventory.quantity < item.quantity) {
                throw new api_error_1.default(400, `Insufficient stock for variant ${item.varient}`);
            }
            inventory.quantity -= item.quantity;
            await inventory.save();
        }
        const cart = await cart_model_1.default.findOne({
            user: userId,
        });
        if (cart) {
            cart.items.splice(0, cart.items.length);
            await cart.save();
        }
        res.status(200).json(new api_response_1.default("Payment verified successfully", {
            payment,
            order,
        }));
    }
    catch (error) {
        next(error);
    }
};
exports.verifyPayment = verifyPayment;
