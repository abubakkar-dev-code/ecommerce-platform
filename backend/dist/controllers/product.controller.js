"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterProducts = exports.deleteProduct = exports.updateProduct = exports.getSingleProduct = exports.seachProducts = exports.getProducts = exports.createProduct = void 0;
const api_error_1 = __importDefault(require("../utils/api-error"));
const product_model_1 = __importDefault(require("../models/product.model"));
const category_model_1 = __importDefault(require("../models/category.model"));
const brand_model_1 = __importDefault(require("../models/brand.model"));
const api_response_1 = __importDefault(require("../utils/api-response"));
const productVariant_model_1 = __importDefault(require("../models/productVariant.model"));
const productImageSchema_1 = __importDefault(require("../models/productImageSchema"));
const createProduct = async (req, res, next) => {
    try {
        const { name, slug, description, category, brand } = req.body;
        if (!name || !slug || !category || !brand) {
            throw new api_error_1.default(400, "name and slugs are required feilds");
        }
        const existingProduct = await product_model_1.default.findOne({ slug });
        if (existingProduct) {
            throw new api_error_1.default(400, "A product with same slug already exist,It must be unique");
        }
        const existingCategory = await category_model_1.default.findById(category);
        if (!existingCategory) {
            throw new api_error_1.default(404, "Category not found");
        }
        if (!existingCategory.isActive) {
            throw new api_error_1.default(409, "We can't able to add create the products under the Inactive category");
        }
        const existingBrand = await brand_model_1.default.findById(brand);
        if (!existingBrand) {
            throw new api_error_1.default(404, "Brand not found");
        }
        if (!existingBrand.isActive) {
            throw new api_error_1.default(409, "Brand is inactive,please use the valid or active Brand");
        }
        const product = await product_model_1.default.create({
            name,
            slug,
            description,
            category,
            brand,
        });
        res
            .status(201)
            .json(new api_response_1.default("Product created successfully", product));
    }
    catch (error) {
        next(error);
    }
};
exports.createProduct = createProduct;
const getProducts = async (_req, res, next) => {
    try {
        const products = await product_model_1.default.find();
        if (products.length === 0) {
            throw new api_error_1.default(404, "There are no products");
        }
        const productsWithDetails = await Promise.all(products.map(async (product) => {
            const variants = await productVariant_model_1.default.find({
                product: product._id,
                isActive: true,
            });
            const images = await productImageSchema_1.default.find({
                product: product._id,
                isActive: true,
            }).sort({ sortOrder: 1 });
            return {
                ...product.toObject(),
                variants,
                images,
            };
        }));
        res
            .status(200)
            .json(new api_response_1.default("Products fetched successfully", productsWithDetails));
    }
    catch (error) {
        next(error);
    }
};
exports.getProducts = getProducts;
const seachProducts = async (req, res, next) => {
    try {
        const { search } = req.query;
        if (!search) {
            throw new api_error_1.default(400, "please provide the search value");
        }
        const brands = await brand_model_1.default.find({
            name: {
                $regex: search,
                $options: "i",
            },
        });
        if (!brands) {
            throw new api_error_1.default(404, "brand not found");
        }
        const brandIds = brands.map((brand) => brand.id);
        const categories = await category_model_1.default.find({
            name: {
                $regex: search,
                $options: "i",
            },
        });
        if (!categories) {
            throw new api_error_1.default(404, "category not found");
        }
        const categoryIds = categories.map((category) => category.id);
        const products = await product_model_1.default.find({
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
            .json(new api_response_1.default("Products fetched successfully", products));
    }
    catch (error) {
        next(error);
    }
};
exports.seachProducts = seachProducts;
const getSingleProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const product = await product_model_1.default.findById(id);
        if (!product) {
            throw new api_error_1.default(404, "Product not found");
        }
        const variants = await productVariant_model_1.default.find({
            product: product._id,
            isActive: true,
        });
        const images = await productImageSchema_1.default.find({
            product: product._id,
            isActive: true,
        }).sort({ sortOrder: 1 });
        console.log(product, "product");
        const categories = await category_model_1.default.findOne({
            _id: product.category,
            isActive: true,
        });
        const brand = await brand_model_1.default.findOne({
            _id: product.brand,
            isActive: true,
        });
        const productWithDetails = {
            ...product.toObject(),
            variants,
            images,
            categories,
            brand,
        };
        res
            .status(200)
            .json(new api_response_1.default("Product fetched successfully", productWithDetails));
    }
    catch (error) {
        next(error);
    }
};
exports.getSingleProduct = getSingleProduct;
const updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, slug, description, category, brand } = req.body;
        if (!name && !slug && !description && !category && !brand) {
            throw new api_error_1.default(400, "name,slug,description,category and brand are required fields");
        }
        const product = await product_model_1.default.findById(id);
        if (!product) {
            throw new api_error_1.default(404, "No Product found");
        }
        product.name = name ?? product.name;
        product.slug = slug ?? product.slug;
        product.description = description ?? product.description;
        product.category = category ?? product.category;
        product.brand = brand ?? product.brand;
        await product.save();
        res
            .status(201)
            .json(new api_response_1.default("Product updated successfully", product));
    }
    catch (error) {
        next(error);
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const product = await product_model_1.default.findById(id);
        if (!product) {
            throw new api_error_1.default(404, "Product not found");
        }
        if (!product.isActive) {
            throw new api_error_1.default(400, "Product already in deactivated state");
        }
        product.isActive = false;
        await product.save();
        res
            .status(201)
            .json(new api_response_1.default("Product deactivated successfully", product));
    }
    catch (error) {
        next(error);
    }
};
exports.deleteProduct = deleteProduct;
const filterProducts = async (req, res, next) => {
    try {
        const { brand, category, minPrice, maxPrice, sort, page = "1", limit = "10", } = req.query;
        const min = minPrice ? Number(minPrice) : undefined;
        const max = maxPrice ? Number(maxPrice) : undefined;
        const filter = {
            isActive: true,
        };
        if (brand) {
            filter.brand = brand;
        }
        if (category) {
            filter.category = category;
        }
        const varientFilter = {
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
        const matchedVarients = await productVariant_model_1.default.find(varientFilter);
        const productids = matchedVarients.map((varient) => varient.product);
        if (productids.length === 0) {
            throw new api_error_1.default(404, "No products found");
        }
        filter._id = { $in: productids };
        const sortOption = {};
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
        const currentPage = Number(page);
        const itemsPerPage = Number(limit);
        const skip = (currentPage - 1) * itemsPerPage;
        const totalProducts = await product_model_1.default.countDocuments(filter);
        const totalPages = Math.ceil(totalProducts / itemsPerPage);
        const filteredProducts = await product_model_1.default.find(filter)
            .sort(sortOption)
            .skip(skip)
            .limit(itemsPerPage);
        const pagination = {
            currentPage,
            totalPages,
            itemsPerPage,
            totalProducts,
        };
        res
            .status(200)
            .json(new api_response_1.default("Products filtered successfully", filteredProducts, pagination));
    }
    catch (error) {
        next(error);
    }
};
exports.filterProducts = filterProducts;
