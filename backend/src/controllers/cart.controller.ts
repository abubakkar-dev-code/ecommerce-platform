import { NextFunction, Request, Response } from "express";
import { Error as MongooseError } from "mongoose";
import ApiError from "../utils/api-error";
import Product from "../models/product.model";
import Varient from "../models/productVariant.model";
import { Inventory } from "../models/Inventory.model";
import Cart from "../models/cart.model";
import ApiResponse from "../utils/api-response";
import { objectId, parse } from "../validation/catalog.validation";
import { requireActiveParents } from "../services/catalog.service";
import { toPaise } from "../services/pricing.service";

const cartError = (error: unknown) => error instanceof MongooseError.VersionError ||
  (!!error && typeof error === "object" && "code" in error && error.code === 11000)
  ? new ApiError(409, "Cart changed. Refresh your cart and retry.") : error;

export const createCart = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { productId, varientId } = req.params as {
      productId: string;
      varientId: string;
    };

    const { quantity } = req.body ?? {};
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(401, "Please login to add items to cart");
    }

    parse(objectId, productId);
    parse(objectId, varientId);

    if (!Number.isSafeInteger(quantity) || quantity < 1) {
      throw new ApiError(400, "Quantity must be at least 1");
    }

    const product = await Product.findById(productId);

    if (!product?.isActive) {
      throw new ApiError(404, "Product not found");
    }

    const varient = await Varient.findById(varientId);

    if (!varient?.isActive) {
      throw new ApiError(404, "Varient not found");
    }

    await requireActiveParents(String(product.category), String(product.brand));

    if (varient.product.toString() !== product._id.toString()) {
      throw new ApiError(400, "Varient doesn't belong to this product");
    }

    const inventoryDetails = await Inventory.findOne({
      varient: varientId,
    });

    if (!inventoryDetails) {
      throw new ApiError(404, "Inventory details not found");
    }

    const available = inventoryDetails.quantity - (inventoryDetails.reservedQuantity ?? 0);
    if (available < quantity) {
      throw new ApiError(
        400,
        "The requested quantity is unavailable",
      );
    }

    const productPrice = varient.price;

    const orderedItems = {
      product: productId,
      varient: varientId,
      quantity,
      price: productPrice,
    };

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = await Cart.create({
        user: userId,
        items: [orderedItems],
      });

      res.status(201).json(new ApiResponse("Added to cart successfully", cart));

      return;
    }

    const existingItem = cart.items.find(
      (item) => item.varient.equals(varientId as string),
    );

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;

      if (newQuantity > available) {
        throw new ApiError(
          400,
          "The requested quantity is unavailable",
        );
      }

      existingItem.quantity = newQuantity;
    } else {
      cart.items.push(orderedItems);
    }

    await cart.save();

    res.status(201).json(new ApiResponse("Added to cart successfully", cart));
  } catch (error) {
    next(cartError(error));
  }
};
export const getCart = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError(400, "please login to see your cart");
    }
    const cart = await Cart.findOne({ user: userId })
      .populate("items.product")
      .populate<{ items: Array<{ _id: string; product: unknown; varient: { price?: number } | null; quantity: number; price: number }> }>("items.varient")
      .lean();
    if (!cart) {
      throw new ApiError(400, "Cart is Empty,keep shopping");
    }
    let subtotalPaise = 0;
    const cartItems = cart.items.map((item) => {
      const price = item.varient?.price ?? item.price;
      const itemPaise = toPaise(price) * item.quantity;
      if (!Number.isSafeInteger(itemPaise) || !Number.isSafeInteger(subtotalPaise + itemPaise)) {
        throw new ApiError(400, "Cart amount exceeds supported range");
      }
      subtotalPaise += itemPaise;
      return { ...item, price, itemTotal: itemPaise / 100 };
    });
    const totalAmount = subtotalPaise / 100;
    res.status(200).json(
      new ApiResponse("Cart fetched successfully", {
        cartItems,
        totalAmount,
      }),
    );
  } catch (error) {
    next(cartError(error));
  }
};
export const updateCart = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError(401, "Please login to update your cart");
    }
    const { varientId } = req.params;
    const { quantity } = req.body ?? {};
    parse(objectId, varientId);
    if (!Number.isSafeInteger(quantity) || quantity < 1) {
      throw new ApiError(400, "quantity must be at least 1");
    }
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      throw new ApiError(400, "Cart is Empty");
    }
    const requiredItem = cart.items.find(
      (item) => item.varient.equals(varientId as string),
    );
    if (!requiredItem) {
      throw new ApiError(404, "Item not found");
    }
    const inventory = await Inventory.findOne({ varient: varientId });
    if (!inventory) {
      throw new ApiError(404, "Inventory not found");
    }
    if (quantity > requiredItem.quantity && inventory.quantity - (inventory.reservedQuantity ?? 0) < quantity) {
      throw new ApiError(
        400,
        "The requested quantity is unavailable",
      );
    }
    requiredItem.quantity = quantity;
    await cart.save();
    res.status(200).json(new ApiResponse("Cart updated successfully", cart));
  } catch (error) {
    next(cartError(error));
  }
};
export const removeCart = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError(404, "unauthorized,please login");
    }
    const { varientId } = req.params;
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      throw new ApiError(400, "cart is empty");
    }
    const existingVarient = cart.items.find(
      (item) => item.varient.equals(varientId as string),
    );
    if (!existingVarient) {
      throw new ApiError(404, "item not found in cart");
    }
    cart.items.pull({ varient: varientId });
    await cart?.save();
    res.status(200).json(new ApiResponse("Item removed from cart", cart));
  } catch (error) {
    next(cartError(error));
  }
};
export const clearCart = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError(400, "unauthorized,please login");
    }
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      throw new ApiError(400, "cart is empty");
    }
    cart.items.splice(0, cart.items.length);
    await cart.save();
    res.status(200).json(new ApiResponse("Cart cleared successfully", cart));
  } catch (error) {
    next(cartError(error));
  }
};
