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
      throw new ApiError(404, "product not found");
    }
    if (!req.files) {
      throw new ApiError(409, "Please upload an images");
    }
    const files = req.files as { [fieldName: string]: Express.Multer.File[] };
    const primaryImage = files.primaryImage?.[0];
    const thumbnails = files.thumbnails ?? [];

    if (!primaryImage) {
      throw new ApiError(409, "Please upload a primary image");
    }
    const existingImages = await ProductImage.findById(productId);
    if (existingImages) {
      throw new ApiError(409, "Product already has images");
    }
    const productImage = await ProductImage.create({
      product: productId,
      primaryImage: primaryImage.path,
      primaryPublicId: primaryImage.filename,
      thumbnails: thumbnails.map((file) => ({
        url: file.path,
        publicId: file.filename,
      })),
    });
    res
      .status(201)
      .json(new ApiResponse("Images uploaded successfully", productImage));
  } catch (error) {
    next(error);
  }
};
export const getImages = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    if (!product) {
      throw new ApiError(404, "product not found");
    }
    const images = await ProductImage.findOne({
      product: productId,
      isActive: true,
    });
    if (!images) {
      throw new ApiError(404, "images not found");
    }
    res
      .status(200)
      .json(new ApiResponse("Images fetched successfully", images));
  } catch (error) {
    next(error);
  }
};

export const updatePrimaryImage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { productImageId } = req.params;
    const existingImage = await ProductImage.findById(productImageId);
    if (!existingImage) {
      throw new ApiError(404, "Image not found");
    }
    if (!req.file) {
      throw new ApiError(400, "Please upload an image");
    }
    const file = req.file;
    const oldPrimaryPublicId = existingImage.primaryPublicId;
    existingImage.primaryImage = file.path;
    existingImage.primaryPublicId = file.filename;
    await existingImage.save();
    if (oldPrimaryPublicId) {
      await cloudinary.uploader.destroy(oldPrimaryPublicId);
    }
    res
      .status(2001)
      .json(
        new ApiResponse("Primary Image updated successfully", existingImage),
      );
  } catch (error) {
    next(error);
  }
};
export const updateThumbnails = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const uploadedFiles = (req.files as Express.Multer.File[]) ?? [];
  try {
    const { productImageId } = req.params;
    const { mode, publicId } = req.body;
    const existingImage = await ProductImage.findById(productImageId);
    if (!existingImage) {
      throw new ApiError(404, "Images not found ");
    }
    if (mode !== "single" && mode !== "all") {
      throw new ApiError(400, 'Mode must be "single" or "all"');
    }
    if (uploadedFiles.length === 0) {
      throw new ApiError(409, "Please upload an image");
    }
    const oldPublicIds: string[] = [];
    if (mode === "single") {
      if (!publicId) {
        throw new ApiError(400, "publicId is must");
      }
      if (uploadedFiles.length !== 1) {
        throw new ApiError(400, "please upload one file");
      }
      if (!existingImage.thumbnails || existingImage.thumbnails.length === 0) {
        throw new ApiError(404, "No thumbnails exist for this product");
      }
      const existingThumbnailIndex = existingImage.thumbnails?.findIndex(
        (file) => file.publicId === publicId,
      );
      if (existingThumbnailIndex === -1) {
        throw new ApiError(404, "Thumbnail not found");
      }
      oldPublicIds.push(
        existingImage.thumbnails[existingThumbnailIndex]?.publicId,
      );
      existingImage.thumbnails[existingThumbnailIndex].url =
        uploadedFiles[0].path;
      existingImage.thumbnails[existingThumbnailIndex].publicId =
        uploadedFiles[0].filename;
      if (mode === "all") {
        oldPublicIds.push(
          ...existingImage.thumbnails.map((thumb) => thumb.publicId),
        );
        existingImage.thumbnails = uploadedFiles.map((file) => ({
          url: file.path,
          publicId: file.filename,
        }));
      }
      await existingImage.save();
      for (const publicId of oldPublicIds) {
        const result = await cloudinary.uploader.destroy(publicId, {
          resource_type: "image",
        });
        console.log(result);
      }
      res
        .status(200)
        .json(
          new ApiResponse("Thumbnails updated successfully", existingImage),
        );
    }
  } catch (error) {
    next(error);
  }
};

export const deletePrimaryImage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { productImageId } = req.params;
    const existingImage = await ProductImage.findById(productImageId);
    if (!existingImage) {
      throw new ApiError(404, "Primary Image not found ");
    }
    if (existingImage.primaryPublicId) {
      await cloudinary.uploader.destroy(existingImage.primaryPublicId);
    }
    existingImage.primaryImage = "";
    existingImage.primaryPublicId = "";
    await existingImage.save();
    res
      .status(200)
      .json(new ApiResponse("Primary Image deleted successfully", {}));
  } catch (error) {
    next(error);
  }
};
export const deleteThumbnails = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { productImageId } = req.params;
    const { mode, publicId } = req.body;
    if (mode !== "single" && mode !== "all") {
      throw new ApiError(400, 'Mode must be "single" or "all"');
    }
    const existingImage = await ProductImage.findById(productImageId);
    if (!existingImage) {
      throw new ApiError(404, "Image not found");
    }

    if (mode === "single") {
      if (!publicId) {
        throw new ApiError(400, "publicId is must");
      }

      if (!existingImage.thumbnails || existingImage.thumbnails.length === 0) {
        throw new ApiError(404, "No thumbnails exist for this product");
      }
      const thumbnailindex = existingImage.thumbnails?.findIndex(
        (thumb) => thumb.publicId === publicId,
      );
      if (thumbnailindex === -1) {
        throw new ApiError(404, "image not found");
      }
      await cloudinary.uploader.destroy(
        existingImage.thumbnails[thumbnailindex].publicId,
        { resource_type: "image" },
      );
      existingImage.thumbnails.splice(thumbnailindex, 1);
    }
    let oldPublicids: string[] = [];
    if (mode === "all") {
      oldPublicids.push(
        ...(existingImage.thumbnails?.map((thumb) => thumb.publicId) || []),
      );
      if (!existingImage.thumbnails || existingImage.thumbnails.length === 0) {
        throw new ApiError(404, "No thumbnails exist for this product");
      }
      existingImage.thumbnails.splice(0, existingImage.thumbnails.length);
    }
    await existingImage.save();
    for (const publicId of oldPublicids) {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
      });
      console.log(result);
    }
    res
      .status(200)
      .json(new ApiResponse("Thumbnails deleted successfully", existingImage));
  } catch (error) {
    next(error);
  }
};
