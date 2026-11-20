import { NextFunction, Request, Response } from "express";
import Product from "../models/product.model";
import Category from "../models/category.model";
import ApiError from "../utils/api-error";
import ApiResponse from "../utils/api-response";
import { listProducts, requireActiveParents } from "../services/catalog.service";
import { catalogError, catalogQuery, objectId, parse, productCreate, productUpdate } from "../validation/catalog.validation";

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = parse(productCreate, req.body);
    await requireActiveParents(body.category, body.brand);
    const product = await Product.create(body);
    res.status(201).json(new ApiResponse("Product created successfully", product));
  } catch (error) { next(catalogError(error)); }
};

const list = async (req: Request, res: Response, next: NextFunction, searchRequired = false) => {
  try {
    const query = parse(catalogQuery, req.query);
    if (searchRequired && !query.search) throw new ApiError(400, "please provide the search value");
    // Parse original string query once in the service; transformed values stay internal.
    const result = await listProducts(req.query);
    res.status(200).json({ ...new ApiResponse("Products fetched successfully", result.data, result.pagination), brandIds: result.brandIds });
  } catch (error) { next(catalogError(error)); }
};
export const getProducts = (req: Request, res: Response, next: NextFunction) => list(req, res, next);
export const searchProducts = (req: Request, res: Response, next: NextFunction) => list(req, res, next, true);
export const filterProducts = (req: Request, res: Response, next: NextFunction) => list(req, res, next);

export const getSingleProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parse(objectId, req.params.id);
    const result = await listProducts({}, id);
    const product = result.data[0];
    if (!product) throw new ApiError(404, "Product not found");
    const category = await Category.findById(product.category);
    res.status(200).json(new ApiResponse("Product fetched successfully", { ...product, categories: category, brand: product.brandDetails }));
  } catch (error) { next(catalogError(error)); }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parse(objectId, req.params.id);
    const body = parse(productUpdate, req.body);
    const product = await Product.findById(id);
    if (!product) throw new ApiError(404, "No Product found");
    // Validate unchanged relationships too when publishing an existing product.
    if ((body.isActive ?? product.isActive) || body.category || body.brand) {
      await requireActiveParents(body.category ?? String(product.category), body.brand ?? String(product.brand));
    }
    Object.assign(product, body);
    await product.save();
    res.status(201).json(new ApiResponse("Product updated successfully", product));
  } catch (error) { next(catalogError(error)); }
};
export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findById(parse(objectId, req.params.id));
    if (!product) throw new ApiError(404, "Product not found");
    product.isActive = false;
    await product.save();
    res.status(201).json(new ApiResponse("Product deactivated successfully", product));
  } catch (error) { next(catalogError(error)); }
};
