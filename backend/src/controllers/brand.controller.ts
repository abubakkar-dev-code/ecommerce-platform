import { NextFunction, Request, Response } from "express";
import ApiError from "../utils/api-error";
import Brand from "../models/brand.model";
import ApiResponse from "../utils/api-response";

export const createBrand = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, slug, description, logo } = req.body;
    console.log(req.body);
    if (!name || !slug) {
      throw new ApiError(400, "name and slug are required");
    }
    const existingBrand = await Brand.findOne({ slug });
    if (existingBrand) {
      throw new ApiError(409, "A brans same name already exist");
    }
    const brand = await Brand.create({
      name,
      slug,
      description,
      logo,
    });
    res.status(201).json(new ApiResponse("Brand created successfully", brand));
  } catch (error) {
    next(error);
  }
};
export const getBrands = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const brands = await Brand.find();
    if (!brands) {
      throw new ApiError(404, "No brands found for this category");
    }
    res
      .status(200)
      .json(new ApiResponse("Brands details fetched successfully", brands));
  } catch (error) {
    next(error);
  }
};
export const updateBrand = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    const { name, slug, description, logo, isActive } = req.body;

    const brand = await Brand.findById(id);

    if (!brand) {
      throw new ApiError(404, "Brand not found");
    }
    if (slug && slug !== brand.slug) {
      const existingBrand = await Brand.findOne({
        slug,
        _id: { $ne: id },
      });

      if (existingBrand) {
        throw new ApiError(409, "A brand with the same slug already exists");
      }
    }

    brand.name = name ?? brand.name;
    brand.slug = slug ?? brand.slug;
    brand.description = description ?? brand.description;
    brand.logo = logo ?? brand.logo;
    brand.isActive = isActive ?? brand.isActive;

    await brand.save();

    res.status(200).json(new ApiResponse("Brand updated successfully", brand));
  } catch (error) {
    next(error);
  }
};
export const deleteBrand = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    const brand = await Brand.findById(id);

    if (!brand) {
      throw new ApiError(404, "Brand not found");
    }

    if (!brand.isActive) {
      throw new ApiError(400, "Brand is already inactive");
    }

    brand.isActive = false;

    await brand.save();

    res
      .status(200)
      .json(new ApiResponse("Brand deactivated successfully", brand));
  } catch (error) {
    next(error);
  }
};
