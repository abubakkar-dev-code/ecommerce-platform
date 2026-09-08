import { NextFunction, Request, Response } from "express";
import ApiError from "../utils/api-error";
import Product from "../models/product.model";
import Varient from "../models/productVariant.model";
import { Inventory } from "../models/Inventory.model";
import Cart from "../models/cart.model";
import ApiResponse from "../utils/api-response";

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
    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError(404, "User not found");
    }
    if (!productId || !varientId) {
      throw new ApiError(400, "productId and varientId are missing");
    }
    const product = await Product.findById(productId);
    if (!product) {
      throw new ApiError(404, "product not found");
    }
    const varient = await Varient.findById(varientId);
    if (!varient) {
      throw new ApiError(404, "varient not found");
    }
    if (varient.product.toString() !== productId) {
      throw new ApiError(400, "varient doesn't belong to this product");
    }
    const inventoryDetails = await Inventory.findOne({ varient: varientId });
    if (!inventoryDetails) {
      throw new ApiError(404, "Inventory details not found");
    }
    if (inventoryDetails?.quantity < 1) {
      throw new ApiError(400, "Product out of stock");
    }
    const productPrice = varient.price;
    const orderedItems = {
      product: productId,
      varient: varientId,
      quantity: 1,
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
    } else {
      const existingItem = cart.items.find(
        (item) => item.varient.toString() === varientId,
      );
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.items.push(orderedItems);
      }
    }
    await cart?.save();
    res.status(201).json(new ApiResponse("Added to cart successfully", cart));
  } catch (error) {
    next(error);
  }
};
