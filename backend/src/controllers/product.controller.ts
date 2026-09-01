import { NextFunction, Request, Response } from "express";
import ApiError from "../utils/api-error";
import Product from "../models/product.model";
import Category from "../models/category.model";
import Brand from "../models/brand.model";
import ApiResponse from "../utils/api-response";
import Varient from "../models/productVariant.model";

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
  _req: Request,
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

export const seachProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { search } = req.query as { search?: string };
    if (!search) {
      throw new ApiError(400, "please provide the search value");
    }
    const brands = await Brand.find({
      name: {
        $regex: search,
        $options: "i",
      },
    });
    if (!brands) {
      throw new ApiError(404, "brand not found");
    }
    const brandIds = brands.map((brand) => brand.id);
    const categories = await Category.find({
      name: {
        $regex: search,
        $options: "i",
      },
    });
    if (!categories) {
      throw new ApiError(404, "category not found");
    }
    const categoryIds = categories.map((category) => category.id);

    const products = await Product.find({
      isActive: true,
      $or: [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          slug: {
            $regex: search,
            $options: "i",
          },
        },
        {
          description: {
            $regex: search,
            $options: "i",
          },
        },
        {
          brand: {
            $in: brandIds,
          },
        },
        {
          category: {
            $in: categoryIds,
          },
        },
      ],
    });
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
export const filterProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { brand, category, minPrice, maxPrice, sort } = req.query as {
      brand?: string;
      category?: string;
      minPrice?: string;
      maxPrice?: string;
      sort?: string;
    };
    const min = minPrice ? Number(minPrice) : undefined;
    const max = maxPrice ? Number(maxPrice) : undefined;
    const filter: any = {
      isActive: true,
    };
    if (brand) {
      filter.brand = brand;
    }
    if (category) {
      filter.category = category;
    }
    const varientFilter: any = {
      isActive: true,
    };
    if (min !== undefined || max !== undefined) {
      varientFilter.price = {};
    }
    if (min !== undefined) {
      varientFilter.price.$gte = min;
    }
    if (max !== undefined) {
      varientFilter.price.$lte = max;
    }
    const matchedVarients = await Varient.find(varientFilter);
    const productids = matchedVarients.map((varient) => varient.product);
    if (productids.length === 0) {
      throw new ApiError(404, "No products found");
    }
    filter._id = { $in: productids };
    const sortOption: any = {};
    if (sort === "name-asc") {
      sortOption.name = 1;
    }
    if (sort === "name-dsc") {
      sortOption.name = -1;
    }
    if (sort === "newest") {
      sortOption.createdAt = -1;
    }
    if (sort === "oldest") {
      sortOption.createdAt = 1;
    }
    const filteredProducts = await Product.find(filter).sort(sortOption);
    res
      .status(200)
      .json(
        new ApiResponse("Products filtered successfully", filteredProducts),
      );
  } catch (error) {
    next(error);
  }
};
