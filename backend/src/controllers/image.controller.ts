import { NextFunction, Request, Response } from "express";
import ApiResponse from "../utils/api-response";
import ApiError from "../utils/api-error";
import cloudinary from "../config/cloudinary";
import Product from "../models/product.model";
import ProductImage from "../models/productImageSchema";

export const createImage = async (
  req: Request<{ productId: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    if (!req.file) {
      throw new ApiError(400, "Please upload an image");
    }

    const productImage = await ProductImage.create({
      product: productId,
      image: req.file.path,
      publicId: req.file.filename,
    });

    res
      .status(201)
      .json(
        new ApiResponse(
          "Image uploaded successfully",
          productImage,
        ),
      );
  } catch (error) {
    next(error);
  }
};

export const getProductImages = async (
  req: Request<{ productId: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    const images = await ProductImage.find({
      product: productId,
      isActive: true,
    }).sort({ sortOrder: 1 });

    if (images.length === 0) {
      throw new ApiError(404, "No images found");
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          "Images fetched successfully",
          images,
        ),
      );
  } catch (error) {
    next(error);
  }
};

export const updateImageById = async (
  req: Request<{ imageId: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { imageId } = req.params;
    const { isPrimary, sortOrder, isActive } = req.body;
    console.log(req.file)

    const productImage = await ProductImage.findById(imageId);

    if (!productImage) {
      throw new ApiError(404, "Image not found");
    }

    if (isPrimary !== undefined) {
      productImage.isPrimary = isPrimary;
    }

    if (sortOrder !== undefined) {
      productImage.sortOrder = sortOrder;
    }

    if (isActive !== undefined) {
      productImage.isActive = isActive;
    }

    if (req.file) {
      const oldPublicId = productImage.publicId;

      productImage.image = req.file.path;
      productImage.publicId = req.file.filename;

      await productImage.save();

      if (oldPublicId) {
        try {
          const result = await cloudinary.uploader.destroy(
            oldPublicId,
            { resource_type: "image" },
          );

          if (result.result !== "ok" && result.result !== "not found") {
            console.error(
              "Could not delete the previous Cloudinary image:",
              result,
            );
          }
        } catch (error) {
          console.error(
            "Failed to delete the previous Cloudinary image:",
            error,
          );
        }
      }

      res
        .status(200)
        .json(
          new ApiResponse(
            "Image updated successfully",
            productImage,
          ),
        );

      return;
    }

    await productImage.save();

    res
      .status(200)
      .json(
        new ApiResponse(
          "Image updated successfully",
          productImage,
        ),
      );
  } catch (error) {
    next(error);
  }
};

export const deleteImageById = async (
  req: Request<{ imageId: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { imageId } = req.params;

    const productImage = await ProductImage.findById(imageId);

    if (!productImage) {
      throw new ApiError(404, "Product image not found");
    }

    if (productImage.publicId) {
      const result = await cloudinary.uploader.destroy(
        productImage.publicId,
        { resource_type: "image" },
      );

      if (result.result !== "ok" && result.result !== "not found") {
        throw new ApiError(
          502,
          "Could not delete the image from Cloudinary",
        );
      }
    }

    await ProductImage.findByIdAndDelete(imageId);

    res
      .status(200)
      .json(
        new ApiResponse(
          "Product image deleted successfully",
          null,
        ),
      );
  } catch (error) {
    next(error);
  }
};
