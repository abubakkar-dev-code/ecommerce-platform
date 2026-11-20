"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVarient = exports.updatevarient = exports.getVrientById = exports.getVarient = exports.createProductVariant = void 0;
const product_model_1 = __importDefault(require("../models/product.model"));
const productVariant_model_1 = __importDefault(require("../models/productVariant.model"));
const api_error_1 = __importDefault(require("../utils/api-error"));
const api_response_1 = __importDefault(require("../utils/api-response"));
const catalog_service_1 = require("../services/catalog.service");
const catalog_validation_1 = require("../validation/catalog.validation");
const activeProduct = async (id) => {
    const product = await product_model_1.default.findById(id);
    if (!product || !product.isActive)
        throw new api_error_1.default(404, "Product not found");
    await (0, catalog_service_1.requireActiveParents)(String(product.category), String(product.brand));
    return product;
};
const createProductVariant = async (req, res, next) => {
    try {
        const body = (0, catalog_validation_1.parse)(catalog_validation_1.variantCreate, req.body);
        await activeProduct(body.product);
        const variant = await productVariant_model_1.default.create(body);
        res.status(201).json(new api_response_1.default("Product variant created successfully", variant));
    }
    catch (error) {
        next((0, catalog_validation_1.catalogError)(error));
    }
};
exports.createProductVariant = createProductVariant;
const getVarient = async (req, res, next) => {
    try {
        const id = (0, catalog_validation_1.parse)(catalog_validation_1.objectId, req.params.id);
        const query = (0, catalog_validation_1.parse)(catalog_validation_1.pageQuery, req.query);
        await activeProduct(id);
        const filter = { product: id, isActive: true };
        const [variants, totalProducts] = await Promise.all([
            productVariant_model_1.default.find(filter).sort({ _id: 1 }).skip((query.page - 1) * query.limit).limit(query.limit),
            productVariant_model_1.default.countDocuments(filter),
        ]);
        res.status(200).json(new api_response_1.default("Product varients fetched successfully", variants, {
            currentPage: query.page, totalPages: Math.ceil(totalProducts / query.limit), itemsPerPage: query.limit, totalProducts,
        }));
    }
    catch (error) {
        next((0, catalog_validation_1.catalogError)(error));
    }
};
exports.getVarient = getVarient;
const getVrientById = async (req, res, next) => {
    try {
        const variant = await productVariant_model_1.default.findById((0, catalog_validation_1.parse)(catalog_validation_1.objectId, req.params.id));
        if (!variant || !variant.isActive)
            throw new api_error_1.default(404, "sorry varient not available");
        await activeProduct(String(variant.product));
        res.status(200).json(new api_response_1.default("single varient fetched sucessfully", variant));
    }
    catch (error) {
        next((0, catalog_validation_1.catalogError)(error));
    }
};
exports.getVrientById = getVrientById;
const updatevarient = async (req, res, next) => {
    try {
        const id = (0, catalog_validation_1.parse)(catalog_validation_1.objectId, req.params.id);
        const body = (0, catalog_validation_1.parse)(catalog_validation_1.variantUpdate, req.body);
        const variant = await productVariant_model_1.default.findById(id);
        if (!variant)
            throw new api_error_1.default(404, "varient doesn't exist");
        if (body.isActive ?? variant.isActive)
            await activeProduct(String(variant.product));
        const price = body.price ?? variant.price;
        const comparedAt = body.comparedAt ?? variant.comparedAt;
        if (comparedAt != null && comparedAt < price)
            throw new api_error_1.default(400, "Compared-at price cannot be below price");
        Object.assign(variant, body);
        await variant.save();
        res.status(201).json(new api_response_1.default("varient updated successfully", variant));
    }
    catch (error) {
        next((0, catalog_validation_1.catalogError)(error));
    }
};
exports.updatevarient = updatevarient;
const deleteVarient = async (req, res, next) => {
    try {
        const variant = await productVariant_model_1.default.findById((0, catalog_validation_1.parse)(catalog_validation_1.objectId, req.params.id));
        if (!variant)
            throw new api_error_1.default(404, "varient not found");
        variant.isActive = false;
        await variant.save();
        res.status(200).json(new api_response_1.default("product deactivated successfully", variant));
    }
    catch (error) {
        next((0, catalog_validation_1.catalogError)(error));
    }
};
exports.deleteVarient = deleteVarient;
