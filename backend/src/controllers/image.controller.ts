import { NextFunction, Request, Response } from "express";
import ApiResponse from "../utils/api-response";
import ApiError from "../utils/api-error";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "../config/env";
import s3Client from "../config/s3.config";
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
    if (!req.file) {
      throw new ApiError(400, "Please upload  the image");
    }
    const imageKey = `products/${Date.now()}-${req.file.originalname}`;
    const command = new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET_NAME,
      Key: imageKey,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    });
    await s3Client.send(command);
    const productImage = await ProductImage.create({
      product: productId,
      image: imageKey,
    });
    res
      .status(200)
      .json(new ApiResponse("Image uploaded successfully", productImage));
  } catch (error) {
    next(error);
  }
};
export const getProductImages = async (
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
    const images = await ProductImage.find({
      product: productId,
      isActive: true,
    }).sort({ sortOrder: 1 });
    if (images.length === 0) {
      throw new ApiError(404, "no image found");
    }
    res
      .status(200)
      .json(new ApiResponse("Images fetched successfully", images));
  } catch (error) {
    next(error);
  }
};
export const updateImageById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { imageId } = req.params;
    const { isPrimary, sortOrder, isActive } = req.body;
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
      const oldKey = productImage.image;
      const newKey = `products/${Date.now()}-${req.file.originalname}`;
      const commmand = new PutObjectCommand({
        Bucket: env.AWS_S3_BUCKET_NAME,
        Key: newKey,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      });
      await s3Client.send(commmand);
      productImage.image = newKey;

      const deleteCommand = new DeleteObjectCommand({
        Bucket: env.AWS_S3_BUCKET_NAME,
        Key: oldKey,
      });
      await s3Client.send(deleteCommand);
    }
    await productImage.save();
    res
      .status(200)
      .json(new ApiResponse("Image updated successfully", productImage));
  } catch (error) {
    next(error);
  }
};
export const deleteImageById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { imageId } = req.params;
    const productImage = await ProductImage.findById(imageId);
    if (!productImage) {
      throw new ApiError(404, "product Image not found");
    }
    const deleteCommand = new DeleteObjectCommand({
      Bucket: env.AWS_S3_BUCKET_NAME,
      Key: productImage.image,
    });
    await s3Client.send(deleteCommand);
    await ProductImage.findByIdAndDelete(imageId);
    res
      .status(200)
      .json(new ApiResponse("Product image deleted successfully", null));
  } catch (error) {
    next(error);
  }
};
