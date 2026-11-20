import { NextFunction, Request, Response } from "express";
import Product from "../models/product.model";
import Varient from "../models/productVariant.model";
import ApiError from "../utils/api-error";
import ApiResponse from "../utils/api-response";
import { requireActiveParents } from "../services/catalog.service";
import { catalogError, objectId, pageQuery, parse, variantCreate, variantUpdate } from "../validation/catalog.validation";

const activeProduct = async (id: string) => {
  const product = await Product.findById(id);
  if (!product || !product.isActive) throw new ApiError(404, "Product not found");
  await requireActiveParents(String(product.category), String(product.brand));
  return product;
};
export const createProductVariant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = parse(variantCreate, req.body);
    await activeProduct(body.product);
    const variant = await Varient.create(body);
    res.status(201).json(new ApiResponse("Product variant created successfully", variant));
  } catch (error) { next(catalogError(error)); }
};
export const getVarient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parse(objectId, req.params.id);
    const query = parse(pageQuery, req.query);
    await activeProduct(id);
    const filter = { product: id, isActive: true };
    const [variants, totalProducts] = await Promise.all([
      Varient.find(filter).sort({ _id: 1 }).skip((query.page - 1) * query.limit).limit(query.limit),
      Varient.countDocuments(filter),
    ]);
    res.status(200).json(new ApiResponse("Product varients fetched successfully", variants, {
      currentPage: query.page, totalPages: Math.ceil(totalProducts / query.limit), itemsPerPage: query.limit, totalProducts,
    }));
  } catch (error) { next(catalogError(error)); }
};
export const getVrientById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const variant = await Varient.findById(parse(objectId, req.params.id));
    if (!variant || !variant.isActive) throw new ApiError(404, "sorry varient not available");
    await activeProduct(String(variant.product));
    res.status(200).json(new ApiResponse("single varient fetched sucessfully", variant));
  } catch (error) { next(catalogError(error)); }
};
export const updatevarient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parse(objectId, req.params.id);
    const body = parse(variantUpdate, req.body);
    const variant = await Varient.findById(id);
    if (!variant) throw new ApiError(404, "varient doesn't exist");
    if (body.isActive ?? variant.isActive) await activeProduct(String(variant.product));
    const price = body.price ?? variant.price;
    const comparedAt = body.comparedAt ?? variant.comparedAt;
    if (comparedAt != null && comparedAt < price) throw new ApiError(400, "Compared-at price cannot be below price");
    Object.assign(variant, body);
    await variant.save();
    res.status(201).json(new ApiResponse("varient updated successfully", variant));
  } catch (error) { next(catalogError(error)); }
};
export const deleteVarient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const variant = await Varient.findById(parse(objectId, req.params.id));
    if (!variant) throw new ApiError(404, "varient not found");
    variant.isActive = false;
    await variant.save();
    res.status(200).json(new ApiResponse("product deactivated successfully", variant));
  } catch (error) { next(catalogError(error)); }
};
