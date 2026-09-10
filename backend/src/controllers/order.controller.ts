import { NextFunction, Request, Response } from "express";
import Cart from "../models/cart.model";
import Address from "../models/address.model";
import Product from "../models/product.model";
import Order from "../models/order.model";
import ApiError from "../utils/api-error";
import ApiResponse from "../utils/api-response";
import { Inventory } from "../models/Inventory.model";
import Varient from "../models/productVariant.model";

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
    const { addressId } = req.body;

    if (!addressId) {
      throw new ApiError(400, "Address is required");
    }
    const cart = await Cart.findOne({
      user: userId,
    });

    if (!cart || cart.items.length === 0) {
      throw new ApiError(400, "Cart is empty");
    }
    const address = await Address.findOne({
      _id: addressId,
      user: userId,
    });
    if (!address) {
      throw new ApiError(404, "Address not found");
    }
    const orderItems = [];
    let subtotal = 0;
    for (const item of cart.items) {
      const product = await Product.findById(item.product);
      if (!product) {
        throw new ApiError(404, "Product not found");
      }
      if (!product.isActive) {
        throw new ApiError(400, "Product is not available");
      }
      const varient = await Varient.findById(item.varient);
      if (!varient) {
        throw new ApiError(404, "Variant not found");
      }
      if (!varient.isActive) {
        throw new ApiError(400, "Variant is not available");
      }
      if (varient.product.toString() !== product._id.toString()) {
        throw new ApiError(400, "Variant does not belong to this product");
      }
      const inventory = await Inventory.findOne({
        varient: item.varient,
      });

      if (!inventory) {
        throw new ApiError(404, "Inventory not found");
      }
      if (inventory.quantity < item.quantity) {
        throw new ApiError(
          400,
          `Only ${inventory.quantity} items are available`,
        );
      }
      const price = varient.price;
      const itemTotal = price * item.quantity;
      subtotal += itemTotal;
      orderItems.push({
        product: product._id,
        varient: varient._id,
        quantity: item.quantity,
        price: price,
      });
    }
    const shippingCharge = 0;
    const totalAmount = subtotal + shippingCharge;
    const order = await Order.create({
      user: userId,
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
      paymentStatus: "pending",
      orderStatus: "pending",
    });
    res.status(201).json(new ApiResponse("Order created successfully", order));
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
    res.status(200).json(new ApiResponse("order fetched successfully", order));
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
    const { orderId } = req.params;
    const order = await Order.findOne({ user: userId, _id: orderId });
    if (!order) {
      throw new ApiError(404, "Product not Found");
    }
    if (
      order.orderStatus === "shipped" ||
      order.orderStatus === "delivered" ||
      order.orderStatus === "cancelled"
    ) {
      throw new ApiError(400, "You can't cancel the order at thisd stage");
    }
    order.orderStatus = "cancelled";
    await order.save();
    res
      .status(200)
      .json(new ApiResponse("Order cancelled successfully", order));
  } catch (error) {
    next(error);
  }
};
