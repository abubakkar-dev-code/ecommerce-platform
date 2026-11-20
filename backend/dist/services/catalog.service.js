"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listProducts = exports.requireActiveParents = exports.requireCategoryParent = void 0;
const mongoose_1 = require("mongoose");
const product_model_1 = __importDefault(require("../models/product.model"));
const category_model_1 = __importDefault(require("../models/category.model"));
const brand_model_1 = __importDefault(require("../models/brand.model"));
const productVariant_model_1 = __importDefault(require("../models/productVariant.model"));
const productImageSchema_1 = __importDefault(require("../models/productImageSchema"));
const api_error_1 = __importDefault(require("../utils/api-error"));
const catalog_validation_1 = require("../validation/catalog.validation");
const requireCategoryParent = async (parentId, categoryId) => {
    const visited = new Set(categoryId ? [categoryId] : []);
    let cursor = parentId;
    while (cursor) {
        if (visited.has(cursor) || visited.size >= 32)
            throw new api_error_1.default(409, "Invalid category hierarchy");
        visited.add(cursor);
        const parent = await category_model_1.default.findById(cursor);
        if (!parent || !parent.isActive)
            throw new api_error_1.default(409, "Parent category is unavailable");
        cursor = parent.parentCategory ? String(parent.parentCategory) : null;
    }
};
exports.requireCategoryParent = requireCategoryParent;
const requireActiveParents = async (categoryId, brandId) => {
    const [category, brand] = await Promise.all([category_model_1.default.findById(categoryId), brand_model_1.default.findById(brandId)]);
    if (!category || !brand)
        throw new api_error_1.default(404, "Category or brand not found");
    if (!category.isActive || !brand.isActive)
        throw new api_error_1.default(409, "Category or brand is inactive");
};
exports.requireActiveParents = requireActiveParents;
// Bounded facet results and batched enrichment replace per-product query loops.
const listProducts = async (input, productId) => {
    const query = (0, catalog_validation_1.parse)(catalog_validation_1.catalogQuery, input);
    const match = { isActive: true };
    if (productId)
        match._id = new mongoose_1.Types.ObjectId(productId);
    if (query.category)
        match.category = new mongoose_1.Types.ObjectId(query.category);
    if (query.brand)
        match.brand = new mongoose_1.Types.ObjectId(query.brand);
    const stages = [
        { $match: match },
        { $lookup: { from: category_model_1.default.collection.name, localField: "category", foreignField: "_id",
                pipeline: [{ $match: { isActive: true } }, { $project: { name: 1, slug: 1 } }], as: "_category" } },
        { $lookup: { from: brand_model_1.default.collection.name, localField: "brand", foreignField: "_id",
                pipeline: [{ $match: { isActive: true } }, { $project: { name: 1, slug: 1 } }], as: "_brand" } },
        { $match: { "_category.0": { $exists: true }, "_brand.0": { $exists: true } } },
        { $lookup: { from: productVariant_model_1.default.collection.name, localField: "_id", foreignField: "product",
                pipeline: [{ $match: { isActive: true } }, { $group: { _id: null, minPrice: { $min: "$price" }, maxPrice: { $max: "$price" } } }], as: "_prices" } },
    ];
    if (query.search) {
        const pattern = { $regex: (0, catalog_validation_1.escapeSearch)(query.search), $options: "i" };
        stages.push({ $match: { $or: ["name", "slug", "description", "_category.name", "_brand.name"].map((field) => ({ [field]: pattern })) } });
    }
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
        // Match a single variant in range, rather than unrelated min/max variants.
        const price = {};
        if (query.minPrice !== undefined)
            price.$gte = query.minPrice;
        if (query.maxPrice !== undefined)
            price.$lte = query.maxPrice;
        stages.push({ $lookup: { from: productVariant_model_1.default.collection.name, localField: "_id", foreignField: "product",
                pipeline: [{ $match: { isActive: true, price } }, { $limit: 1 }, { $project: { _id: 1 } }], as: "_matchingPrice" } }, { $match: { "_matchingPrice.0": { $exists: true } } });
    }
    stages.push({ $set: { _sortPrice: { $ifNull: [{ $arrayElemAt: ["$_prices.minPrice", 0] }, null] } } });
    const sort = query.sort === "name-asc" ? { name: 1, _id: 1 }
        : ["name-dsc", "name-desc"].includes(query.sort) ? { name: -1, _id: 1 }
            : query.sort === "oldest" ? { createdAt: 1, _id: 1 }
                : query.sort === "price-asc" ? { _sortPrice: 1, _id: 1 }
                    : query.sort === "price-desc" ? { _sortPrice: -1, _id: 1 } : { createdAt: -1, _id: 1 };
    stages.push({ $facet: { total: [{ $count: "count" }], data: [
                { $sort: sort }, { $skip: (query.page - 1) * query.limit }, { $limit: query.limit },
                { $project: { _category: 0, _brand: 0, _prices: 0, _matchingPrice: 0, _sortPrice: 0 } },
            ] } });
    const [result] = await product_model_1.default.aggregate(stages).option({ maxTimeMS: 5000 });
    const data = result?.data ?? [];
    const ids = data.map((product) => product._id);
    const [variants, images] = ids.length ? await Promise.all([
        productVariant_model_1.default.aggregate([
            { $match: { product: { $in: ids }, isActive: true } }, { $sort: { _id: 1 } },
            { $group: { _id: "$product", items: { $firstN: { input: "$$ROOT", n: 100 } } } },
        ]).option({ maxTimeMS: 5000 }),
        productImageSchema_1.default.find({ product: { $in: ids }, isActive: true }).limit(query.limit).lean(),
    ]) : [[], []];
    const variantsByProduct = new Map(variants.map((entry) => [String(entry._id), entry.items]));
    const imagesByProduct = new Map(images.map((entry) => [String(entry.product), entry]));
    const totalProducts = result?.total[0]?.count ?? 0;
    return { data: data.map((product) => ({ ...product, variants: variantsByProduct.get(String(product._id)) ?? [],
            images: imagesByProduct.has(String(product._id)) ? [imagesByProduct.get(String(product._id))] : [] })),
        pagination: { currentPage: query.page, totalPages: Math.ceil(totalProducts / query.limit), itemsPerPage: query.limit, totalProducts } };
};
exports.listProducts = listProducts;
