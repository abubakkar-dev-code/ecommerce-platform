import { NextFunction, Request, Response } from "express";
import ApiError from "../utils/api-error";
import Product from "../models/product.model";
import Category from "../models/category.model";
import Brand from "../models/brand.model";
import ApiResponse from "../utils/api-response";

export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, slug, description, category, brand } = req.body;
    if (!name || !slug || !category || !brand) {
      throw new ApiError(400, "name and slugs are required feilds");
    }
    const existingProduct = await Product.findOne({ slug });
    if (existingProduct) {
      throw new ApiError(
        400,
        "A product with same slug already exist,It must be unique",
      );
    }
    const existingCategory = await Category.findById(category);
    if (!existingCategory) {
      throw new ApiError(404, "Category not found");
    }
    if (!existingCategory.isActive) {
      throw new ApiError(
        409,
        "We can't able to add create the products under the Inactive category",
      );
    }
    const existingBrand = await Brand.findById(brand);
    if (!existingBrand) {
      throw new ApiError(404, "Brand not found");
    }
    if (!existingBrand.isActive) {
      throw new ApiError(
        409,
        "Brand is inactive,please use the valid or active Brand",
      );
    }
    const product = await Product.create({
      name,
      slug,
      description,
      category,
      brand,
    });
    res
      .status(201)
      .json(new ApiResponse("Product created successfully", product));
  } catch (error) {
    next(error);
  }
};
export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const products = await Product.find();
    if (!products) {
      throw new ApiError(404, "theres no products");
    }
    res
      .status(200)
      .json(new ApiResponse("Products fetched successfully", products));
  } catch (error) {
    next(error);
  }
};
export const getSingleProduct = async (
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
    res
      .status(200)
      .json(new ApiResponse("Product fetched successfully", product));
  } catch (error) {
    next(error);
  }
};
export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { name, slug, description, category, brand } = req.body;
    if (!name && !slug && !description && !category && !brand) {
      throw new ApiError(
        400,
        "name,slug,description,category and brand are required fields",
      );
    }
    const product = await Product.findById(id);
    if (!product) {
      throw new ApiError(404, "No Product found");
    }
    product.name = name ?? product.name;
    product.slug = slug ?? product.slug;
    product.description = description ?? product.description;
    product.category = category ?? product.category;
    product.brand = brand ?? product.brand;
    await product.save();
    res
      .status(201)
      .json(new ApiResponse("Product updated successfully", product));
  } catch (error) {
    next(error);
  }
};
export const deleteProduct = async (
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
    if (!product.isActive) {
      throw new ApiError(400, "Product already in deactivated state");
    }
    product.isActive = false;
    await product.save();
    res
      .status(201)
      .json(new ApiResponse("Product deactivated successfully", product));
  } catch (error) {
    next(error);
  }
};
