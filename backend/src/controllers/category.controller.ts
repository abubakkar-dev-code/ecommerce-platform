import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import ApiError from "../utils/api-error";
import Category from "../models/category.model";
import ApiResponse from "../utils/api-response";
import { categoryCreate, categoryUpdate, catalogError, objectId, pageQuery, parse, slug as slugSchema } from "../validation/catalog.validation";
import { requireCategoryParent } from "../services/catalog.service";

export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, slug, description, image, parentCategory, isActive } = parse(categoryCreate, req.body);
    if (!name || !slug) {
      throw new ApiError(400, "name and slug are required");
    }
    const isDuplicateSlugExist = await Category.findOne({ slug });
    if (isDuplicateSlugExist) {
      throw new ApiError(400, "A category with same slug already exist");
    }
    await requireCategoryParent(parentCategory);
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
      parentCategory: parentCategory ?? null,
      isActive,
    });
    res.status(201).json(new ApiResponse("Product category created", category));
  } catch (error) {
    next(catalogError(error));
  }
};
export const getCategories = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const query = parse(pageQuery, req.query);
    const [categories, totalProducts] = await Promise.all([
      Category.find({ isActive: true }).sort({ name: 1, _id: 1 }).skip((query.page - 1) * query.limit).limit(query.limit),
      Category.countDocuments({ isActive: true }),
    ]);
    res
      .status(200)
      .json(new ApiResponse("categories feched successfully", categories, { currentPage: query.page, totalPages: Math.ceil(totalProducts / query.limit), itemsPerPage: query.limit, totalProducts }));
  } catch (error) {
    next(catalogError(error));
  }
};
export const getCategoriesBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const slug = parse(slugSchema, req.params.slug);
    const query = parse(pageQuery, req.query);
    const category = await Category.findOne({ slug, isActive: true });
    if (!category) {
      throw new ApiError(404, "category not found");
    }
    const filter = { parentCategory: category._id, isActive: true };
    const [childCategory, totalProducts] = await Promise.all([
      Category.find(filter).sort({ name: 1, _id: 1 }).skip((query.page - 1) * query.limit).limit(query.limit),
      Category.countDocuments(filter),
    ]);

    res
      .status(200)
      .json(
        new ApiResponse("child categories fetched by parent", childCategory, { currentPage: query.page, totalPages: Math.ceil(totalProducts / query.limit), itemsPerPage: query.limit, totalProducts }),
      );
  } catch (error) {
    next(catalogError(error));
  }
};
export const updateCategories = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parse(objectId, req.params.id);
    const { name, slug, description, image, parentCategory, isActive } = parse(categoryUpdate, req.body);
    if (!name && !slug && description === undefined && image === undefined && parentCategory === undefined && isActive === undefined) {
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
    await requireCategoryParent(parentCategory, id);
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
    if (parentCategory !== undefined) category.parentCategory = parentCategory ? new Types.ObjectId(parentCategory) : null;
    category.isActive = isActive ?? category.isActive;
    await category.save();
    res
      .status(201)
      .json(new ApiResponse("categories updated successfull", category));
  } catch (error) {
    next(catalogError(error));
  }
};
export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parse(objectId, req.params.id);
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
    next(catalogError(error));
  }
};
