"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.getSingleProduct = exports.filterProducts = exports.searchProducts = exports.getProducts = exports.createProduct = void 0;
const product_model_1 = __importDefault(require("../models/product.model"));
const category_model_1 = __importDefault(require("../models/category.model"));
const brand_model_1 = __importDefault(require("../models/brand.model"));
const api_error_1 = __importDefault(require("../utils/api-error"));
const api_response_1 = __importDefault(require("../utils/api-response"));
const catalog_service_1 = require("../services/catalog.service");
const catalog_validation_1 = require("../validation/catalog.validation");
const createProduct = async (req, res, next) => {
    try {
        const body = (0, catalog_validation_1.parse)(catalog_validation_1.productCreate, req.body);
        await (0, catalog_service_1.requireActiveParents)(body.category, body.brand);
        const product = await product_model_1.default.create(body);
        res.status(201).json(new api_response_1.default("Product created successfully", product));
    }
    catch (error) {
        next((0, catalog_validation_1.catalogError)(error));
    }
};
exports.createProduct = createProduct;
const list = async (req, res, next, searchRequired = false) => {
    try {
        const query = (0, catalog_validation_1.parse)(catalog_validation_1.catalogQuery, req.query);
        if (searchRequired && !query.search)
            throw new api_error_1.default(400, "please provide the search value");
        // Parse original string query once in the service; transformed values stay internal.
        const result = await (0, catalog_service_1.listProducts)(req.query);
        res.status(200).json(new api_response_1.default("Products fetched successfully", result.data, result.pagination));
    }
    catch (error) {
        next((0, catalog_validation_1.catalogError)(error));
    }
};
const getProducts = (req, res, next) => list(req, res, next);
exports.getProducts = getProducts;
const searchProducts = (req, res, next) => list(req, res, next, true);
exports.searchProducts = searchProducts;
const filterProducts = (req, res, next) => list(req, res, next);
exports.filterProducts = filterProducts;
const getSingleProduct = async (req, res, next) => {
    try {
        const id = (0, catalog_validation_1.parse)(catalog_validation_1.objectId, req.params.id);
        const result = await (0, catalog_service_1.listProducts)({}, id);
        const product = result.data[0];
        if (!product)
            throw new api_error_1.default(404, "Product not found");
        const [category, brand] = await Promise.all([category_model_1.default.findById(product.category), brand_model_1.default.findById(product.brand)]);
        res.status(200).json(new api_response_1.default("Product fetched successfully", { ...product, categories: category, brand }));
    }
    catch (error) {
        next((0, catalog_validation_1.catalogError)(error));
    }
};
exports.getSingleProduct = getSingleProduct;
const updateProduct = async (req, res, next) => {
    try {
        const id = (0, catalog_validation_1.parse)(catalog_validation_1.objectId, req.params.id);
        const body = (0, catalog_validation_1.parse)(catalog_validation_1.productUpdate, req.body);
        const product = await product_model_1.default.findById(id);
        if (!product)
            throw new api_error_1.default(404, "No Product found");
        // Validate unchanged relationships too when publishing an existing product.
        if ((body.isActive ?? product.isActive) || body.category || body.brand) {
            await (0, catalog_service_1.requireActiveParents)(body.category ?? String(product.category), body.brand ?? String(product.brand));
        }
        Object.assign(product, body);
        await product.save();
        res.status(201).json(new api_response_1.default("Product updated successfully", product));
    }
    catch (error) {
        next((0, catalog_validation_1.catalogError)(error));
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res, next) => {
    try {
        const product = await product_model_1.default.findById((0, catalog_validation_1.parse)(catalog_validation_1.objectId, req.params.id));
        if (!product)
            throw new api_error_1.default(404, "Product not found");
        product.isActive = false;
        await product.save();
        res.status(201).json(new api_response_1.default("Product deactivated successfully", product));
    }
    catch (error) {
        next((0, catalog_validation_1.catalogError)(error));
    }
};
exports.deleteProduct = deleteProduct;
