"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteImageById = exports.updateImageById = exports.getProductImages = exports.createImage = void 0;
const api_response_1 = __importDefault(require("../utils/api-response"));
const api_error_1 = __importDefault(require("../utils/api-error"));
const client_s3_1 = require("@aws-sdk/client-s3");
const env_1 = require("../config/env");
const s3_config_1 = __importDefault(require("../config/s3.config"));
const product_model_1 = __importDefault(require("../models/product.model"));
const productImageSchema_1 = __importDefault(require("../models/productImageSchema"));
const createImage = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const product = await product_model_1.default.findById(productId);
        if (!product) {
            throw new api_error_1.default(404, "product not found");
        }
        if (!req.file) {
            throw new api_error_1.default(400, "Please upload  the image");
        }
        const imageKey = `products/${Date.now()}-${req.file.originalname}`;
        const command = new client_s3_1.PutObjectCommand({
            Bucket: env_1.env.AWS_S3_BUCKET_NAME,
            Key: imageKey,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
        });
        await s3_config_1.default.send(command);
        const productImage = await productImageSchema_1.default.create({
            product: productId,
            image: imageKey,
        });
        res
            .status(200)
            .json(new api_response_1.default("Image uploaded successfully", productImage));
    }
    catch (error) {
        next(error);
    }
};
exports.createImage = createImage;
const getProductImages = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const product = await product_model_1.default.findById(productId);
        if (!product) {
            throw new api_error_1.default(404, "product not found");
        }
        const images = await productImageSchema_1.default.find({
            product: productId,
            isActive: true,
        }).sort({ sortOrder: 1 });
        if (images.length === 0) {
            throw new api_error_1.default(404, "no image found");
        }
        res
            .status(200)
            .json(new api_response_1.default("Images fetched successfully", images));
    }
    catch (error) {
        next(error);
    }
};
exports.getProductImages = getProductImages;
const updateImageById = async (req, res, next) => {
    try {
        const { imageId } = req.params;
        const { isPrimary, sortOrder, isActive } = req.body;
        const productImage = await productImageSchema_1.default.findById(imageId);
        if (!productImage) {
            throw new api_error_1.default(404, "Image not found");
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
            const commmand = new client_s3_1.PutObjectCommand({
                Bucket: env_1.env.AWS_S3_BUCKET_NAME,
                Key: newKey,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
            });
            await s3_config_1.default.send(commmand);
            productImage.image = newKey;
            const deleteCommand = new client_s3_1.DeleteObjectCommand({
                Bucket: env_1.env.AWS_S3_BUCKET_NAME,
                Key: oldKey,
            });
            await s3_config_1.default.send(deleteCommand);
        }
        await productImage.save();
        res
            .status(200)
            .json(new api_response_1.default("Image updated successfully", productImage));
    }
    catch (error) {
        next(error);
    }
};
exports.updateImageById = updateImageById;
const deleteImageById = async (req, res, next) => {
    try {
        const { imageId } = req.params;
        const productImage = await productImageSchema_1.default.findById(imageId);
        if (!productImage) {
            throw new api_error_1.default(404, "product Image not found");
        }
        const deleteCommand = new client_s3_1.DeleteObjectCommand({
            Bucket: env_1.env.AWS_S3_BUCKET_NAME,
            Key: productImage.image,
        });
        await s3_config_1.default.send(deleteCommand);
        await productImageSchema_1.default.findByIdAndDelete(imageId);
        res
            .status(200)
            .json(new api_response_1.default("Product image deleted successfully", null));
    }
    catch (error) {
        next(error);
    }
};
exports.deleteImageById = deleteImageById;
