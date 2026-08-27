import { NextFunction, Request, Response } from "express";
import ApiError from "../utils/api-error";
import Product from "../models/product.model";
import Varient from "../models/productVariant.model";
import ApiResponse from "../utils/api-response";

export const createProductVariant = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { product, sku, attributes, price, comparedAt } = req.body;
    if (!product || !sku || !attributes) {
      throw new ApiError(400, "name,attributes and sku are required fields");
    }
    const existingProduct = await Product.findById(product);
    if (!existingProduct) {
      throw new ApiError(400, "The product is not found");
    }
    if (!existingProduct.isActive) {
      throw new ApiError(
        400,
        "can't able to create the variant for deactivated product",
      );
    }
    const existingSKU = await Varient.findOne({ sku });
    if (existingSKU) {
      throw new ApiError(400, "sku must be unique");
    }
    if (price < 0) {
      throw new ApiError(400, "price must be greater than 0");
    }
    if (comparedAt !== undefined && comparedAt < price) {
      throw new ApiError(
        400,
        "compared-At price can't lesser than selling price",
      );
    }
    const productVariant = await Varient.create({
      product,
      sku,
      attributes,
      price,
      comparedAt,
    });
    res
      .status(201)
      .json(
        new ApiResponse("Product variant created successfully", productVariant),
      );
  } catch (error) {
    next(error);
  }
};
export const getVarient = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      throw new ApiError(404, "Product not found");
    }
    const varients = await Varient.find({
    product: product._id
    }).where({ isActive: true });
    if (varients.length === 0) {
      throw new ApiError(404, "No varients found for this product");
    }
    res
      .status(200)
      .json(new ApiResponse("Product varients fetched successfully", varients));
  } catch (error) {
    next(error);
  }
};
export const getVrientById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const varient = await Varient.findById(id);
    if (!varient) {
      throw new ApiError(404, "sorry varient not available");
    }
    res
      .status(200)
      .json(new ApiResponse("single varient fetched sucessfully", varient));
  } catch (error) {
    next(error);
  }
};
export const updatevarient = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { attributes, price, comparedAt, isActive } = req.body;
    if (!attributes && !price && !isActive) {
      throw new ApiError(400, "please enter the required fields");
    }
    const exisitngVarient = await Varient.findById(id);
    if (!exisitngVarient) {
      throw new ApiError(404, "varient doesn't exist");
    }
    if (price !== undefined && price <= 0) {
      throw new ApiError(400, "Price must be greater than 0");
    }
    if (comparedAt !== undefined && comparedAt < price) {
      throw new ApiError(
        400,
        "comparedAt price should be greater than price value",
      );
    }
    exisitngVarient.attributes = attributes ?? exisitngVarient.attributes;
    exisitngVarient.price = price ?? exisitngVarient.price;
    exisitngVarient.comparedAt = comparedAt ?? exisitngVarient.comparedAt;
    exisitngVarient.isActive = isActive ?? exisitngVarient.isActive;
    await exisitngVarient.save();
    res
      .status(201)
      .json(new ApiResponse("varient updated successfully", exisitngVarient));
  } catch (error) {
    next(error);
  }
};
export const deleteVarient = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const varient = await Varient.findById(id);
    if (!varient) {
      throw new ApiError(404, "varient not found");
    }
    if (!varient.isActive) {
      throw new ApiError(400, "varient is already in deactivated state");
    }
    varient.isActive = false;
    await varient.save()
    res.status(200).json(new ApiResponse("product deactivated successfully",varient));
  } catch (error) {
    next(error);
  }
};
