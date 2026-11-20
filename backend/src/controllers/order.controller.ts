import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import Cart from "../models/cart.model";
import { Types } from "mongoose";
import { objectId, parse } from "../validation/catalog.validation";
import { stockTransaction, reserveStock, releaseStock, confirmStock } from "../services/inventory.service";
import Address from "../models/address.model";
import Product from "../models/product.model";
import ProductImage from "../models/productImageSchema";
import Order from "../models/order.model";
import ApiError from "../utils/api-error";
import ApiResponse from "../utils/api-response";
import { Inventory } from "../models/Inventory.model";
import Varient from "../models/productVariant.model";
import { priceCheckout } from "../services/pricing.service";
import { removePurchasedItems } from "../services/checkoutCart.service";
import { queueOrderNotification } from "../services/orderNotification.service";

export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError(401, "Unauthorized, please login");
    }
    const addressId = parse(objectId, req.body?.addressId).toLowerCase();

    const direct = req.body?.buyNow === undefined ? undefined : parse(z.object({
      productId: objectId, variantId: objectId, quantity: z.number().int().min(1).max(1_000_000),
    }).strict(), req.body.buyNow);
    const checkoutSource = direct ? "buy-now" : "cart";
    const paymentMethod = parse(z.enum(["razorpay", "cod"]).default("razorpay"), req.body?.paymentMethod);
    const checkoutKey = req.get("Idempotency-Key");
    if (((req.user?.sessionId || direct || paymentMethod === "cod") && !checkoutKey) || (checkoutKey !== undefined && !/^[a-zA-Z\d_-]{16,100}$/.test(checkoutKey))) {
      throw new ApiError(400, "Invalid checkout idempotency key");
    }
    const checkCheckout = (existing: { checkoutAddress?: Types.ObjectId; checkoutSource?: string; paymentMethod?: string; items: {product: Types.ObjectId; varient: Types.ObjectId; quantity: number}[] }) => {
      const item = existing.items[0];
      if ((existing.paymentMethod ?? "razorpay") !== paymentMethod || (existing.checkoutSource ?? "cart") !== checkoutSource || (direct && (!item || existing.items.length !== 1 ||
          String(item.product) !== direct.productId.toLowerCase() || String(item.varient) !== direct.variantId.toLowerCase() || item.quantity !== direct.quantity))) {
        throw new ApiError(409, "Checkout key already belongs to a different purchase");
      }
      if (String(existing.checkoutAddress) !== addressId) throw new ApiError(409, "Checkout key was already used with another address");
    };
    const { order, created } = await stockTransaction(async (session) => {
      if (checkoutKey) {
        const existing = await Order.findOne({ user: userId, checkoutKey }).select("+checkoutAddress").session(session);
        if (existing) {
          checkCheckout(existing);
          return { order: existing, created: false };
        }
      }
      const lines = direct ? [{
        product: new Types.ObjectId(direct.productId), varient: new Types.ObjectId(direct.variantId), quantity: direct.quantity,
      }] : (await Cart.findOne({ user: userId }).session(session))?.items;
      if (!lines?.length) {
        throw new ApiError(400, "Cart is empty");
      }
      const address = await Address.findOne({
        _id: addressId,
        user: userId,
      }).session(session);
      if (!address) {
        throw new ApiError(404, "Address not found");
      }
      if (lines.length > 100) throw new ApiError(400, "Orders support at most 100 cart lines");
      const variantIds = lines.map((item) => item.varient);
      const productIds = lines.map((item) => item.product);
      const products = await Product.find({ _id: { $in: productIds } })
        .select("isActive name").session(session).lean();
      const variants = await Varient.find({ _id: { $in: variantIds } }).select("product isActive price sku attributes").session(session).lean();
      const inventory = await Inventory.find({ varient: { $in: variantIds } })
        .select("varient quantity reservedQuantity").session(session).lean();
      const activeProducts = new Map(products.filter((product) => product.isActive).map((product) => [String(product._id), product]));
      const photos = await ProductImage.find({ product: { $in: productIds }, isActive: true })
        .select("product primaryImage thumbnails.url").session(session).lean();
      const photoByProduct = new Map(photos.map((photo) => [String(photo.product), photo.primaryImage || photo.thumbnails?.[0]?.url]));
      const variantById = new Map(variants.map((variant) => [String(variant._id), variant]));
      const stockByVariant = new Map(inventory.map((record) => [String(record.varient), record.quantity - (record.reservedQuantity ?? 0)]));

      const orderItems = lines.map((item) => {
        const variantId = String(item.varient);
        const variant = variantById.get(variantId);
        if (!activeProducts.has(String(item.product)) || !variant?.isActive || String(variant.product) !== String(item.product)) {
          throw new ApiError(400, "A cart product or variant is unavailable");
        }
        if (!Number.isSafeInteger(item.quantity) || item.quantity < 1 || (stockByVariant.get(variantId) ?? 0) < item.quantity) {
          throw new ApiError(400, "Insufficient available stock");
        }
        return { product: item.product, varient: item.varient, quantity: item.quantity, price: variant.price,
          productName: activeProducts.get(String(item.product))?.name, image: photoByProduct.get(String(item.product)), sku: variant.sku, attributes: variant.attributes };
      });
      const { subtotal, shippingCharge, totalAmount } = priceCheckout(orderItems);
      const orderId = new Types.ObjectId();
      await reserveStock(orderId, userId, orderItems, session);
      if (paymentMethod === "cod") {
        if (await confirmStock(orderId, session) !== "confirmed") throw new ApiError(409, "Stock changed before order placement");
        if (!direct) await removePurchasedItems(userId, orderItems, session);
        await queueOrderNotification(orderId, userId, "cod_confirmed", session);
      }
      const [createdOrder] = await Order.create([{
        _id: orderId,
        user: userId,
        checkoutSource,
        ...(checkoutKey ? { checkoutKey, checkoutAddress: address._id } : {}),
        items: orderItems,
        shippingAddress: {
          fullName: address.fullName,
          phone: address.phone,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2!,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          country: address.country,
        },
        subtotal,
        shippingCharge,
        totalAmount,
        paymentMethod,
        paymentStatus: "pending",
        orderStatus: paymentMethod === "cod" ? "confirmed" : "pending",
      }], { session });
      return { order: createdOrder!, created: true };
    }).catch(async (error: unknown) => {
      if (!checkoutKey || !error || typeof error !== "object" || !("code" in error) || error.code !== 11000) throw error;
      const existing = await Order.findOne({ user: userId, checkoutKey }).select("+checkoutAddress");
      if (!existing) throw error;
      checkCheckout(existing);
      return { order: existing, created: false };
    });
    const result = order.toObject();
    delete result.checkoutKey;
    delete result.checkoutAddress;
    res.status(created ? 201 : 200).json(new ApiResponse(created ? "Order created successfully" : "Existing order returned", result));
  } catch (error) {
    next(error);
  }
};
export const getOrders = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError(400, "Unauthorized,please login to access");
    }
    const orders = await Order.find({
      user: userId,
    })
      .populate("items.product")
      .populate("items.varient");
    if (orders.length === 0) {
      throw new ApiError(404, "Orders not found");
    }
    res
      .status(200)
      .json(new ApiResponse("Orders fetched successfully", orders));
  } catch (error) {
    next(error);
  }
};
export const getSingleOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError(400, "Unauthorized,please login to access");
    }
    const { orderId } = req.params;
    const order = await Order.findOne({ _id: orderId, user: userId })
      .populate("items.product")
      .populate("items.varient");
    if (!order) {
      throw new ApiError(404, "order not found");
    }
    res.status(200).json(new ApiResponse("single order fetched successfully", order));
  } catch (error) {
    next(error);
  }
};
export const cancelOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError(401, "Unauthorized, please login");
    }
    const orderId = parse(objectId, req.params.orderId);
    const order = await stockTransaction(async (session) => {
      const current = await Order.findOne({ user: userId, _id: orderId }).session(session);
      if (!current) throw new ApiError(404, "Order not found");
      if (current.orderStatus === "cancelled") return current;
      if (["shipped", "delivered", "payment_review"].includes(current.orderStatus)) {
        throw new ApiError(409, "Order cannot be cancelled at this stage");
      }
      // Until the durable refund workflow exists, do not restore stock and
      // acknowledge cancellation while retaining a captured customer payment.
      if (current.paymentStatus === "paid") {
        throw new ApiError(409, "Paid order cancellation requires refund processing; contact support");
      }
      await releaseStock(orderId, "cancelled", session, true);
      current.orderStatus = "cancelled";
      await queueOrderNotification(current._id, userId, "cancelled", session);
      await current.save({ session });
      return current;
    });
    res
      .status(200)
      .json(new ApiResponse("Order cancelled successfully", order));
  } catch (error) {
    next(error);
  }
};
