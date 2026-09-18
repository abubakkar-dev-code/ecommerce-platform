"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVarient = exports.updatevarient = exports.getVrientById = exports.getVarient = exports.createProductVariant = void 0;
const api_error_1 = __importDefault(require("../utils/api-error"));
const product_model_1 = __importDefault(require("../models/product.model"));
const productVariant_model_1 = __importDefault(require("../models/productVariant.model"));
const api_response_1 = __importDefault(require("../utils/api-response"));
const createProductVariant = async (req, res, next) => {
    try {
        const { product, sku, attributes, price, comparedAt } = req.body;
        if (!product || !sku || !attributes) {
            throw new api_error_1.default(400, "name,attributes and sku are required fields");
        }
        const existingProduct = await product_model_1.default.findById(product);
        if (!existingProduct) {
            throw new api_error_1.default(400, "The product is not found");
        }
        if (!existingProduct.isActive) {
            throw new api_error_1.default(400, "can't able to create the variant for deactivated product");
        }
        const existingSKU = await productVariant_model_1.default.findOne({ sku });
        if (existingSKU) {
            throw new api_error_1.default(400, "sku must be unique");
        }
        if (price < 0) {
            throw new api_error_1.default(400, "price must be greater than 0");
        }
        if (comparedAt !== undefined && comparedAt < price) {
            throw new api_error_1.default(400, "compared-At price can't lesser than selling price");
        }
        const productVariant = await productVariant_model_1.default.create({
            product,
            sku,
            attributes,
            price,
            comparedAt,
        });
        res
            .status(201)
            .json(new api_response_1.default("Product variant created successfully", productVariant));
    }
    catch (error) {
        next(error);
    }
};
exports.createProductVariant = createProductVariant;
const getVarient = async (req, res, next) => {
    try {
        const { id } = req.params;
        const product = await product_model_1.default.findById(id);
        if (!product) {
            throw new api_error_1.default(404, "Product not found");
        }
        const varients = await productVariant_model_1.default.find({
            product: product._id
        }).where({ isActive: true });
        if (varients.length === 0) {
            throw new api_error_1.default(404, "No varients found for this product");
        }
        res
            .status(200)
            .json(new api_response_1.default("Product varients fetched successfully", varients));
    }
    catch (error) {
        next(error);
    }
};
exports.getVarient = getVarient;
const getVrientById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const varient = await productVariant_model_1.default.findById(id);
        if (!varient) {
            throw new api_error_1.default(404, "sorry varient not available");
        }
        res
            .status(200)
            .json(new api_response_1.default("single varient fetched sucessfully", varient));
    }
    catch (error) {
        next(error);
    }
};
exports.getVrientById = getVrientById;
const updatevarient = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { attributes, price, comparedAt, isActive } = req.body;
        if (!attributes && !price && !isActive) {
            throw new api_error_1.default(400, "please enter the required fields");
        }
        const exisitngVarient = await productVariant_model_1.default.findById(id);
        if (!exisitngVarient) {
            throw new api_error_1.default(404, "varient doesn't exist");
        }
        if (price !== undefined && price <= 0) {
            throw new api_error_1.default(400, "Price must be greater than 0");
        }
        if (comparedAt !== undefined && comparedAt < price) {
            throw new api_error_1.default(400, "comparedAt price should be greater than price value");
        }
        exisitngVarient.attributes = attributes ?? exisitngVarient.attributes;
        exisitngVarient.price = price ?? exisitngVarient.price;
        exisitngVarient.comparedAt = comparedAt ?? exisitngVarient.comparedAt;
        exisitngVarient.isActive = isActive ?? exisitngVarient.isActive;
        await exisitngVarient.save();
        res
            .status(201)
            .json(new api_response_1.default("varient updated successfully", exisitngVarient));
    }
    catch (error) {
        next(error);
    }
};
exports.updatevarient = updatevarient;
const deleteVarient = async (req, res, next) => {
    try {
        const { id } = req.params;
        const varient = await productVariant_model_1.default.findById(id);
        if (!varient) {
            throw new api_error_1.default(404, "varient not found");
        }
        if (!varient.isActive) {
            throw new api_error_1.default(400, "varient is already in deactivated state");
        }
        varient.isActive = false;
        await varient.save();
        res.status(200).json(new api_response_1.default("product deactivated successfully", varient));
    }
    catch (error) {
        next(error);
    }
};
exports.deleteVarient = deleteVarient;
