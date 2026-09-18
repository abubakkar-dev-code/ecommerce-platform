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

    const { quantity } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(401, "Please login to add items to cart");
    }

    if (!productId || !varientId) {
      throw new ApiError(400, "productId and varientId are missing");
    }

    if (!quantity || quantity < 1) {
      throw new ApiError(400, "Quantity must be at least 1");
    }

    const product = await Product.findById(productId);

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    const varient = await Varient.findById(varientId);

    if (!varient) {
      throw new ApiError(404, "Varient not found");
    }

    if (varient.product.toString() !== productId) {
      throw new ApiError(400, "Varient doesn't belong to this product");
    }

    const inventoryDetails = await Inventory.findOne({
      varient: varientId,
    });

    if (!inventoryDetails) {
      throw new ApiError(404, "Inventory details not found");
    }

    if (inventoryDetails.quantity < quantity) {
      throw new ApiError(
        400,
        `Only ${inventoryDetails.quantity} items are available`,
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
      (item) => item.varient.toString() === varientId,
    );

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;

      if (newQuantity > inventoryDetails.quantity) {
        throw new ApiError(
          400,
          `Only ${inventoryDetails.quantity} items are available`,
        );
      }

      existingItem.quantity = newQuantity;
    } else {
      cart.items.push(orderedItems);
    }

    await cart.save();

    res.status(201).json(new ApiResponse("Added to cart successfully", cart));
  } catch (error) {
    next(error);
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
      .populate("items.varient");
    if (!cart) {
      throw new ApiError(400, "Cart is Empty,keep shopping");
    }
    const cartItems = cart.items.map((item) => {
      const itemTotal = item.price * item.quantity;

      return {
        ...item.toObject(),
        itemTotal,
      };
    });
    const totalAmount = cartItems.reduce(
      (total, item) => total + item.itemTotal,
      0,
    );
    res.status(200).json(
      new ApiResponse("Cart fetched successfully", {
        cartItems,
        totalAmount,
      }),
    );
  } catch (error) {
    next(error);
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
    const { quantity } = req.body;
    if (quantity < 1) {
      throw new ApiError(400, "quantity must be at least 1");
    }
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      throw new ApiError(400, "Cart is Empty");
    }
    const requiredItem = cart.items.find(
      (item) => item.varient.toString() === varientId,
    );
    if (!requiredItem) {
      throw new ApiError(404, "Item not found");
    }
    const inventory = await Inventory.findOne({ varient: varientId });
    if (!inventory) {
      throw new ApiError(404, "Inventory not found");
    }
    if (inventory.quantity < quantity) {
      throw new ApiError(
        400,
        `Stocks are limited,we have only ${inventory.quantity} items left`,
      );
    }
    requiredItem.quantity = quantity;
    await cart.save();
    res.status(200).json(new ApiResponse("Cart updated successfully", cart));
  } catch (error) {
    next(error);
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
      (item) => item.varient.toString() === varientId,
    );
    if (!existingVarient) {
      throw new ApiError(404, "item not found in cart");
    }
    cart.items.pull({ varient: varientId });
    await cart?.save();
    res.status(200).json(new ApiResponse("Item removed from cart", cart));
  } catch (error) {
    next(error);
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
    next(error);
  }
};
