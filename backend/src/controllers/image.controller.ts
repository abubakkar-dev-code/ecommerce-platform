import { NextFunction, Request, Response } from "express";
import { Error as MongooseError } from "mongoose";
import { z } from "zod";
import multer from "multer";
import Product from "../models/product.model";
import ProductImage from "../models/productImageSchema";
import ApiError from "../utils/api-error";
import ApiResponse from "../utils/api-response";
import { objectId, parse } from "../validation/catalog.validation";
import { requireActiveParents } from "../services/catalog.service";
import { validateImage, uploadImage, markAttached, queueCleanup, cleanupImages, type UploadedImage } from "../services/image.service";

const emptyBody = z.object({}).strict();
const thumbnailBody = z.object({ mode: z.enum(["single", "all"]), publicId: z.string().min(1).max(512).optional() }).strict()
  .refine((value) => value.mode !== "single" || !!value.publicId);
const imageError = (error: unknown) => {
  if (error instanceof ApiError) return error;
  if (error instanceof MongooseError.VersionError || (typeof error === "object" && error !== null && "code" in error && error.code === 11000)) {
    return new ApiError(409, "Images changed concurrently; reload and retry");
  }
  return new ApiError(500, "Image operation failed");
};
export const uploadError = (error: unknown, _req: Request, _res: Response, next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    next(new ApiError(error.code === "LIMIT_FILE_SIZE" ? 413 : 400, "Upload limits exceeded or unexpected upload field"));
  } else next(error);
};
const getImageRecord = async (id: unknown) => {
  const image = await ProductImage.findById(parse(objectId, id));
  if (!image || !(await Product.exists({ _id: image.product }))) throw new ApiError(404, "Image or product not found");
  return image;
};
const prepare = async (files: Express.Multer.File[]) => {
  const buffers: Buffer[] = [];
  for (const file of files) buffers.push(await validateImage(file));
  return buffers;
};
const sendUploads = async (buffers: Buffer[], journal: string[]) => {
  const uploaded: UploadedImage[] = [];
  for (const buffer of buffers) uploaded.push(await uploadImage(buffer, journal));
  return uploaded;
};
const abandonUploads = async (ids: string[]) => {
  // Delay unknown provider outcomes: a timed-out upload may still finish remotely.
  await queueCleanup(ids, 5 * 60 * 1000);
};

export const createImage = async (req: Request, res: Response, next: NextFunction) => {
  const journal: string[] = [];
  let committed = false;
  try {
    const productId = parse(objectId, req.params.productId);
    parse(emptyBody, req.body ?? {});
    if (!(await Product.exists({ _id: productId }))) throw new ApiError(404, "product not found");
    if (await ProductImage.exists({ product: productId })) throw new ApiError(409, "Product already has images");
    const files = req.files as Record<string, Express.Multer.File[]> | undefined;
    const primary = files?.primaryImage?.[0];
    if (!primary) throw new ApiError(400, "Please upload a primary image");
    const buffers = await prepare([primary, ...(files?.thumbnails ?? [])]);
    const [uploadedPrimary, ...thumbnails] = await sendUploads(buffers, journal);
    const image = await ProductImage.create({ product: productId, primaryImage: uploadedPrimary!.url,
      primaryPublicId: uploadedPrimary!.publicId, thumbnails });
    committed = true;
    await markAttached(journal);
    res.status(201).json(new ApiResponse("Images uploaded successfully", image));
  } catch (error) {
    if (!committed) await abandonUploads(journal);
    next(imageError(error));
  }
};

export const getImages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = parse(objectId, req.params.productId);
    const product = await Product.findById(productId);
    if (!product || !product.isActive) throw new ApiError(404, "product not found");
    await requireActiveParents(String(product.category), String(product.brand));
    const image = await ProductImage.findOne({ product: productId, isActive: true });
    if (!image) throw new ApiError(404, "images not found");
    res.status(200).json(new ApiResponse("Images fetched successfully", image));
  } catch (error) { next(imageError(error)); }
};

export const updatePrimaryImage = async (req: Request, res: Response, next: NextFunction) => {
  const journal: string[] = [];
  let committed = false;
  try {
    const image = await getImageRecord(req.params.productImageId);
    parse(emptyBody, req.body ?? {});
    if (!req.file) throw new ApiError(400, "Please upload an image");
    const [buffer] = await prepare([req.file]);
    const uploaded = await uploadImage(buffer!, journal);
    const old = image.primaryPublicId ? [image.primaryPublicId] : [];
    await queueCleanup(old, 5 * 60 * 1000, true);
    image.primaryImage = uploaded.url;
    image.primaryPublicId = uploaded.publicId;
    await image.save();
    committed = true;
    await markAttached(journal);
    await cleanupImages(old);
    res.status(200).json(new ApiResponse("Primary Image updated successfully", image));
  } catch (error) {
    if (!committed) await abandonUploads(journal);
    next(imageError(error));
  }
};

export const updateThumbnails = async (req: Request, res: Response, next: NextFunction) => {
  const journal: string[] = [];
  let committed = false;
  try {
    const image = await getImageRecord(req.params.productImageId);
    const { mode, publicId } = parse(thumbnailBody, req.body);
    const files = Array.isArray(req.files) ? req.files : [];
    if (!files.length || files.length > 5 || (mode === "single" && files.length !== 1)) throw new ApiError(400, "Invalid thumbnail count");
    const index = image.thumbnails?.findIndex((thumbnail) => thumbnail.publicId === publicId) ?? -1;
    if (mode === "single" && index === -1) throw new ApiError(404, "Thumbnail not found");
    const buffers = await prepare(files);
    const uploads = await sendUploads(buffers, journal);
    const old = mode === "all" ? (image.thumbnails ?? []).map((thumbnail) => thumbnail.publicId)
      : [image.thumbnails![index]!.publicId];
    await queueCleanup(old, 5 * 60 * 1000, true);
    if (mode === "all") image.thumbnails = uploads;
    else image.thumbnails!.splice(index, 1, uploads[0]!);
    await image.save();
    committed = true;
    await markAttached(journal);
    await cleanupImages(old);
    res.status(200).json(new ApiResponse("Thumbnails updated successfully", image));
  } catch (error) {
    if (!committed) await abandonUploads(journal);
    next(imageError(error));
  }
};

export const deletePrimaryImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const image = await getImageRecord(req.params.productImageId);
    parse(emptyBody, req.body ?? {});
    const old = image.primaryPublicId ? [image.primaryPublicId] : [];
    await queueCleanup(old, 5 * 60 * 1000, true);
    image.primaryImage = "";
    image.primaryPublicId = "";
    await image.save();
    await cleanupImages(old);
    res.status(200).json(new ApiResponse("Primary Image deleted successfully", {}));
  } catch (error) { next(imageError(error)); }
};
export const deleteThumbnails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const image = await getImageRecord(req.params.productImageId);
    const { mode, publicId } = parse(thumbnailBody, req.body);
    const index = image.thumbnails?.findIndex((thumbnail) => thumbnail.publicId === publicId) ?? -1;
    if (mode === "single" && index === -1) throw new ApiError(404, "Thumbnail not found");
    const old = mode === "all" ? (image.thumbnails ?? []).map((thumbnail) => thumbnail.publicId)
      : [image.thumbnails![index]!.publicId];
    await queueCleanup(old, 5 * 60 * 1000, true);
    if (mode === "all") image.thumbnails = [];
    else image.thumbnails!.splice(index, 1);
    await image.save();
    await cleanupImages(old);
    res.status(200).json(new ApiResponse("Thumbnails deleted successfully", image));
  } catch (error) { next(imageError(error)); }
};
