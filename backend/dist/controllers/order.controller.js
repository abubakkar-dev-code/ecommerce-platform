"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelOrder = exports.getSingleOrder = exports.getOrders = exports.createOrder = void 0;
const cart_model_1 = __importDefault(require("../models/cart.model"));
const mongoose_1 = require("mongoose");
const catalog_validation_1 = require("../validation/catalog.validation");
const inventory_service_1 = require("../services/inventory.service");
const address_model_1 = __importDefault(require("../models/address.model"));
const product_model_1 = __importDefault(require("../models/product.model"));
const order_model_1 = __importDefault(require("../models/order.model"));
const api_error_1 = __importDefault(require("../utils/api-error"));
const api_response_1 = __importDefault(require("../utils/api-response"));
const Inventory_model_1 = require("../models/Inventory.model");
const productVariant_model_1 = __importDefault(require("../models/productVariant.model"));
const pricing_service_1 = require("../services/pricing.service");
const createOrder = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new api_error_1.default(401, "Unauthorized, please login");
        }
        const addressId = (0, catalog_validation_1.parse)(catalog_validation_1.objectId, req.body?.addressId);
        if (!addressId) {
            throw new api_error_1.default(400, "Address is required");
        }
        const order = await (0, inventory_service_1.stockTransaction)(async (session) => {
            const cart = await cart_model_1.default.findOne({
                user: userId,
            }).session(session);
            if (!cart || cart.items.length === 0) {
                throw new api_error_1.default(400, "Cart is empty");
            }
            const address = await address_model_1.default.findOne({
                _id: addressId,
                user: userId,
            }).session(session);
            if (!address) {
                throw new api_error_1.default(404, "Address not found");
            }
            const orderItems = [];
            for (const item of cart.items) {
                const product = await product_model_1.default.findById(item.product).session(session);
                if (!product) {
                    throw new api_error_1.default(404, "Product not found");
                }
                if (!product.isActive) {
                    throw new api_error_1.default(400, "Product is not available");
                }
                const varient = await productVariant_model_1.default.findById(item.varient).session(session);
                if (!varient) {
                    throw new api_error_1.default(404, "Variant not found");
                }
                if (!varient.isActive) {
                    throw new api_error_1.default(400, "Variant is not available");
                }
                if (varient.product.toString() !== product._id.toString()) {
                    throw new api_error_1.default(400, "Variant does not belong to this product");
                }
                const inventory = await Inventory_model_1.Inventory.findOne({
                    varient: item.varient,
                }).session(session);
                if (!inventory) {
                    throw new api_error_1.default(404, "Inventory not found");
                }
                if (!Number.isSafeInteger(item.quantity) || item.quantity < 1 || inventory.quantity - inventory.reservedQuantity < item.quantity) {
                    throw new api_error_1.default(400, `Only ${inventory.quantity} items are available`);
                }
                const price = varient.price;
                orderItems.push({
                    product: product._id,
                    varient: varient._id,
                    quantity: item.quantity,
                    price: price,
                });
            }
            const { subtotal, shippingCharge, totalAmount } = (0, pricing_service_1.priceCheckout)(orderItems);
            const orderId = new mongoose_1.Types.ObjectId();
            await (0, inventory_service_1.reserveStock)(orderId, userId, orderItems, session);
            const [created] = await order_model_1.default.create([{
                    _id: orderId,
                    user: userId,
                    items: orderItems,
                    shippingAddress: {
                        fullName: address.fullName,
                        phone: address.phone,
                        addressLine1: address.addressLine1,
                        addressLine2: address.addressLine2,
                        city: address.city,
                        state: address.state,
                        pincode: address.pincode,
                        country: address.country,
                    },
                    subtotal,
                    shippingCharge,
                    totalAmount,
                    paymentStatus: "pending",
                    orderStatus: "pending",
                }], { session });
            return created;
        });
        res.status(201).json(new api_response_1.default("Order created successfully", order));
    }
    catch (error) {
        next(error);
    }
};
exports.createOrder = createOrder;
const getOrders = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new api_error_1.default(400, "Unauthorized,please login to access");
        }
        const orders = await order_model_1.default.find({
            user: userId,
        })
            .populate("items.product")
            .populate("items.varient");
        if (orders.length === 0) {
            throw new api_error_1.default(404, "Orders not found");
        }
        res
            .status(200)
            .json(new api_response_1.default("Orders fetched successfully", orders));
    }
    catch (error) {
        next(error);
    }
};
exports.getOrders = getOrders;
const getSingleOrder = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new api_error_1.default(400, "Unauthorized,please login to access");
        }
        const { orderId } = req.params;
        const order = await order_model_1.default.findOne({ _id: orderId, user: userId })
            .populate("items.product")
            .populate("items.varient");
        if (!order) {
            throw new api_error_1.default(404, "order not found");
        }
        res.status(200).json(new api_response_1.default("single order fetched successfully", order));
    }
    catch (error) {
        next(error);
    }
};
exports.getSingleOrder = getSingleOrder;
const cancelOrder = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new api_error_1.default(401, "Unauthorized, please login");
        }
        const orderId = (0, catalog_validation_1.parse)(catalog_validation_1.objectId, req.params.orderId);
        const order = await (0, inventory_service_1.stockTransaction)(async (session) => {
            const current = await order_model_1.default.findOne({ user: userId, _id: orderId }).session(session);
            if (!current)
                throw new api_error_1.default(404, "Order not found");
            if (current.orderStatus === "cancelled")
                return current;
            if (["shipped", "delivered", "payment_review"].includes(current.orderStatus)) {
                throw new api_error_1.default(409, "Order cannot be cancelled at this stage");
            }
            // Until the durable refund workflow exists, do not restore stock and
            // acknowledge cancellation while retaining a captured customer payment.
            if (current.paymentStatus === "paid") {
                throw new api_error_1.default(409, "Paid order cancellation requires refund processing; contact support");
            }
            await (0, inventory_service_1.releaseStock)(orderId, "cancelled", session, true);
            current.orderStatus = "cancelled";
            await current.save({ session });
            return current;
        });
        res
            .status(200)
            .json(new api_response_1.default("Order cancelled successfully", order));
    }
    catch (error) {
        next(error);
    }
};
exports.cancelOrder = cancelOrder;
