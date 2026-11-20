"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteThumbnails = exports.deletePrimaryImage = exports.updateThumbnails = exports.updatePrimaryImage = exports.getImages = exports.createImage = exports.uploadError = void 0;
const mongoose_1 = require("mongoose");
const zod_1 = require("zod");
const multer_1 = __importDefault(require("multer"));
const product_model_1 = __importDefault(require("../models/product.model"));
const productImageSchema_1 = __importDefault(require("../models/productImageSchema"));
const api_error_1 = __importDefault(require("../utils/api-error"));
const api_response_1 = __importDefault(require("../utils/api-response"));
const catalog_validation_1 = require("../validation/catalog.validation");
const catalog_service_1 = require("../services/catalog.service");
const image_service_1 = require("../services/image.service");
const emptyBody = zod_1.z.object({}).strict();
const thumbnailBody = zod_1.z.object({ mode: zod_1.z.enum(["single", "all"]), publicId: zod_1.z.string().min(1).max(512).optional() }).strict()
    .refine((value) => value.mode !== "single" || !!value.publicId);
const imageError = (error) => {
    if (error instanceof api_error_1.default)
        return error;
    if (error instanceof mongoose_1.Error.VersionError || (typeof error === "object" && error !== null && "code" in error && error.code === 11000)) {
        return new api_error_1.default(409, "Images changed concurrently; reload and retry");
    }
    return new api_error_1.default(500, "Image operation failed");
};
const uploadError = (error, _req, _res, next) => {
    if (error instanceof multer_1.default.MulterError) {
        next(new api_error_1.default(error.code === "LIMIT_FILE_SIZE" ? 413 : 400, "Upload limits exceeded or unexpected upload field"));
    }
    else
        next(error);
};
exports.uploadError = uploadError;
const getImageRecord = async (id) => {
    const image = await productImageSchema_1.default.findById((0, catalog_validation_1.parse)(catalog_validation_1.objectId, id));
    if (!image || !(await product_model_1.default.exists({ _id: image.product })))
        throw new api_error_1.default(404, "Image or product not found");
    return image;
};
const prepare = async (files) => {
    const buffers = [];
    for (const file of files)
        buffers.push(await (0, image_service_1.validateImage)(file));
    return buffers;
};
const sendUploads = async (buffers, journal) => {
    const uploaded = [];
    for (const buffer of buffers)
        uploaded.push(await (0, image_service_1.uploadImage)(buffer, journal));
    return uploaded;
};
const abandonUploads = async (ids) => {
    // Delay unknown provider outcomes: a timed-out upload may still finish remotely.
    await (0, image_service_1.queueCleanup)(ids, 5 * 60 * 1000);
};
const createImage = async (req, res, next) => {
    const journal = [];
    let committed = false;
    try {
        const productId = (0, catalog_validation_1.parse)(catalog_validation_1.objectId, req.params.productId);
        (0, catalog_validation_1.parse)(emptyBody, req.body ?? {});
        if (!(await product_model_1.default.exists({ _id: productId })))
            throw new api_error_1.default(404, "product not found");
        if (await productImageSchema_1.default.exists({ product: productId }))
            throw new api_error_1.default(409, "Product already has images");
        const files = req.files;
        const primary = files?.primaryImage?.[0];
        if (!primary)
            throw new api_error_1.default(400, "Please upload a primary image");
        const buffers = await prepare([primary, ...(files?.thumbnails ?? [])]);
        const [uploadedPrimary, ...thumbnails] = await sendUploads(buffers, journal);
        const image = await productImageSchema_1.default.create({ product: productId, primaryImage: uploadedPrimary.url,
            primaryPublicId: uploadedPrimary.publicId, thumbnails });
        committed = true;
        await (0, image_service_1.markAttached)(journal);
        res.status(201).json(new api_response_1.default("Images uploaded successfully", image));
    }
    catch (error) {
        if (!committed)
            await abandonUploads(journal);
        next(imageError(error));
    }
};
exports.createImage = createImage;
const getImages = async (req, res, next) => {
    try {
        const productId = (0, catalog_validation_1.parse)(catalog_validation_1.objectId, req.params.productId);
        const product = await product_model_1.default.findById(productId);
        if (!product || !product.isActive)
            throw new api_error_1.default(404, "product not found");
        await (0, catalog_service_1.requireActiveParents)(String(product.category), String(product.brand));
        const image = await productImageSchema_1.default.findOne({ product: productId, isActive: true });
        if (!image)
            throw new api_error_1.default(404, "images not found");
        res.status(200).json(new api_response_1.default("Images fetched successfully", image));
    }
    catch (error) {
        next(imageError(error));
    }
};
exports.getImages = getImages;
const updatePrimaryImage = async (req, res, next) => {
    const journal = [];
    let committed = false;
    try {
        const image = await getImageRecord(req.params.productImageId);
        (0, catalog_validation_1.parse)(emptyBody, req.body ?? {});
        if (!req.file)
            throw new api_error_1.default(400, "Please upload an image");
        const [buffer] = await prepare([req.file]);
        const uploaded = await (0, image_service_1.uploadImage)(buffer, journal);
        const old = image.primaryPublicId ? [image.primaryPublicId] : [];
        await (0, image_service_1.queueCleanup)(old, 5 * 60 * 1000, true);
        image.primaryImage = uploaded.url;
        image.primaryPublicId = uploaded.publicId;
        await image.save();
        committed = true;
        await (0, image_service_1.markAttached)(journal);
        await (0, image_service_1.cleanupImages)(old);
        res.status(200).json(new api_response_1.default("Primary Image updated successfully", image));
    }
    catch (error) {
        if (!committed)
            await abandonUploads(journal);
        next(imageError(error));
    }
};
exports.updatePrimaryImage = updatePrimaryImage;
const updateThumbnails = async (req, res, next) => {
    const journal = [];
    let committed = false;
    try {
        const image = await getImageRecord(req.params.productImageId);
        const { mode, publicId } = (0, catalog_validation_1.parse)(thumbnailBody, req.body);
        const files = Array.isArray(req.files) ? req.files : [];
        if (!files.length || files.length > 5 || (mode === "single" && files.length !== 1))
            throw new api_error_1.default(400, "Invalid thumbnail count");
        const index = image.thumbnails?.findIndex((thumbnail) => thumbnail.publicId === publicId) ?? -1;
        if (mode === "single" && index === -1)
            throw new api_error_1.default(404, "Thumbnail not found");
        const buffers = await prepare(files);
        const uploads = await sendUploads(buffers, journal);
        const old = mode === "all" ? (image.thumbnails ?? []).map((thumbnail) => thumbnail.publicId)
            : [image.thumbnails[index].publicId];
        await (0, image_service_1.queueCleanup)(old, 5 * 60 * 1000, true);
        if (mode === "all")
            image.thumbnails = uploads;
        else
            image.thumbnails.splice(index, 1, uploads[0]);
        await image.save();
        committed = true;
        await (0, image_service_1.markAttached)(journal);
        await (0, image_service_1.cleanupImages)(old);
        res.status(200).json(new api_response_1.default("Thumbnails updated successfully", image));
    }
    catch (error) {
        if (!committed)
            await abandonUploads(journal);
        next(imageError(error));
    }
};
exports.updateThumbnails = updateThumbnails;
const deletePrimaryImage = async (req, res, next) => {
    try {
        const image = await getImageRecord(req.params.productImageId);
        (0, catalog_validation_1.parse)(emptyBody, req.body ?? {});
        const old = image.primaryPublicId ? [image.primaryPublicId] : [];
        await (0, image_service_1.queueCleanup)(old, 5 * 60 * 1000, true);
        image.primaryImage = "";
        image.primaryPublicId = "";
        await image.save();
        await (0, image_service_1.cleanupImages)(old);
        res.status(200).json(new api_response_1.default("Primary Image deleted successfully", {}));
    }
    catch (error) {
        next(imageError(error));
    }
};
exports.deletePrimaryImage = deletePrimaryImage;
const deleteThumbnails = async (req, res, next) => {
    try {
        const image = await getImageRecord(req.params.productImageId);
        const { mode, publicId } = (0, catalog_validation_1.parse)(thumbnailBody, req.body);
        const index = image.thumbnails?.findIndex((thumbnail) => thumbnail.publicId === publicId) ?? -1;
        if (mode === "single" && index === -1)
            throw new api_error_1.default(404, "Thumbnail not found");
        const old = mode === "all" ? (image.thumbnails ?? []).map((thumbnail) => thumbnail.publicId)
            : [image.thumbnails[index].publicId];
        await (0, image_service_1.queueCleanup)(old, 5 * 60 * 1000, true);
        if (mode === "all")
            image.thumbnails = [];
        else
            image.thumbnails.splice(index, 1);
        await image.save();
        await (0, image_service_1.cleanupImages)(old);
        res.status(200).json(new api_response_1.default("Thumbnails deleted successfully", image));
    }
    catch (error) {
        next(imageError(error));
    }
};
exports.deleteThumbnails = deleteThumbnails;
