import { NextFunction, Request, Response } from "express";
import ApiError from "../utils/api-error";
import Category from "../models/category.model";
import ApiResponse from "../utils/api-response";

export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, slug, description, image, parentCategory } = req.body;
    if (!name || !slug) {
      throw new ApiError(400, "name and slug are required");
    }
    const isDuplicateSlugExist = await Category.findOne({ slug });
    if (isDuplicateSlugExist) {
      throw new ApiError(400, "A category with same slug already exist");
    }
    if (parentCategory) {
      const parent = await Category.findById(parentCategory);
      if (!parent) {
        throw new ApiError(404, "Parent category not found");
      }
    }
    const category = await Category.create({
      name,
      slug,
      description,
      image,
      parentCategory: parentCategory || null,
    });
    res.status(201).json(new ApiResponse("Product category created", category));
  } catch (error) {
    next(error);
  }
};
export const getCategories = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const categories = await Category.find();
    res
      .status(200)
      .json(new ApiResponse("categories feched successfully", categories));
  } catch (error) {
    next(error);
  }
};
export const getCategoriesBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { slug } = req.params;
    const category = await Category.findOne({ slug });
    if (!category) {
      throw new ApiError(404, "category not found");
    }
    const childCategory = await Category.find({ parentCategory: category._id });

    res
      .status(200)
      .json(
        new ApiResponse("child categories fetched by parent", childCategory),
      );
  } catch (error) {
    next(error);
  }
};
export const updateCategories = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, slug, description, image, parentCategory } = req.body;
    if (!name && !slug) {
      throw new ApiError(400, "name and slug are required");
    }
    const category = await Category.findById(id);
    if (!category) {
      throw new ApiError(404, "Category not found");
    }
    if (slug && slug !== category.slug) {
      const existingCategory = await Category.findOne({
        slug,
        _id: { $ne: id },
      });
      if (existingCategory) {
        throw new ApiError(409, "A category with same slug already exist");
      }
    }
    if (parentCategory !== null && parentCategory !== undefined) {
      if (parentCategory === id) {
        throw new ApiError(409, "A category cannot be its own parent Category");
      }
      const parent = await Category.findById(parentCategory);
      if (!parent) {
        throw new ApiError(404, "Parent category not found");
      }
    }
    category.name = name ?? category.name;
    category.slug = slug ?? category.slug;
    category.description = description ?? category.description;
    category.image = image ?? category.image;
    category.parentCategory = parentCategory ?? category.parentCategory;
    await category.save();
    res
      .status(201)
      .json(new ApiResponse("categories updated successfull", category));
  } catch (error) {
    next(error);
  }
};
export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) {
      throw new ApiError(404, "Category not found");
    }
    if (!category.isActive) {
      throw new ApiError(409, "category is already inactive");
    }
    category.isActive = false;
    await category.save();
    res.status(201).json(new ApiResponse("product deleted successfully"));
  } catch (error) {
    next(error);
  }
};
