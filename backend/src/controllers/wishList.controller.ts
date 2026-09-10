import { NextFunction, Request, Response } from "express";
import ApiError from "../utils/api-error";
import WishList from "../models/whistlist.model";
import ApiResponse from "../utils/api-response";
import Product from "../models/product.model";

export const createWishList = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError(400, "Unauthorized,please login first");
    }
    const { productId } = req.params;
    const product = await Product.findById(productId);
    if (!product) {
      throw new ApiError(404, "Product not found");
    }
    let usersWishList = await WishList.findOne({ user: userId });
    if (!usersWishList) {
      usersWishList = await WishList.create({
        user: userId,
        products: [product._id],
      });
    } else {
      if (usersWishList.products.includes(product._id)) {
        throw new ApiError(400, "Product already in wishList");
      } else {
        usersWishList.products.push(product._id);
        await usersWishList.save();
      }
    }
    res
      .status(201)
      .json(
        new ApiResponse(
          "product added to wishList successfully",
          usersWishList,
        ),
      );
  } catch (error) {
    next(error);
  }
};
export const getwishList = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError(400, "Unauthorized,please Login first");
    }
    const userWishListt = await WishList.findOne({ user: userId }).populate(
      "products",
    );
    if (!userWishListt) {
      throw new ApiError(400, "WishList is Empty");
    }
    res
      .status(200)
      .json(new ApiResponse("WishList fetched successfully", userWishListt));
  } catch (error) {
    next(error);
  }
};
export const removeWishList = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError(404, "Unauthorized,please login to access");
    }
    const { productId } = req.params;
    const wishList = await WishList.findOne({ user: userId });
    if (!wishList) {
      throw new ApiError(400, "WishList is Empty");
    }
    const product = wishList.products.find(
      (item) => item.toString() === productId,
    );
    if (!product) {
      throw new ApiError(404, "product not found");
    }
    wishList.products = wishList.products.filter(
      (item) => item.toString() !== productId,
    );
    await wishList.save();
    res
      .status(200)
      .json(
        new ApiResponse("Product removed from wishList successfully", wishList),
      );
  } catch (error) {
    next(error);
  }
};
export const clearWishList = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError(400, "Unauthorized,please login to access");
    }
    const wishList = await WishList.findOne({ user: userId });
    if (!wishList) {
      throw new ApiError(400, "WishList is Empty");
    }
    wishList.products = [];
    await wishList.save();
    res
      .status(200)
      .json(new ApiResponse("WishList cleared successfully", wishList));
  } catch (error) {
    next(error);
  }
};
