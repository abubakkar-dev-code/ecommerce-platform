"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupImages = exports.drainImageCleanup = exports.queueCleanup = exports.markAttached = exports.uploadImage = exports.validateImage = void 0;
const node_crypto_1 = require("node:crypto");
const sharp_1 = __importDefault(require("sharp"));
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const productImageSchema_1 = __importDefault(require("../models/productImageSchema"));
const imageAsset_model_1 = __importDefault(require("../models/imageAsset.model"));
const api_error_1 = __importDefault(require("../utils/api-error"));
const validateImage = async (file) => {
    if (!file.buffer || file.buffer.length > 5 * 1024 * 1024)
        throw new api_error_1.default(400, "Image exceeds size limit");
    try {
        const image = (0, sharp_1.default)(file.buffer, { failOn: "warning", limitInputPixels: 16_000_000 });
        const metadata = await image.metadata();
        const mime = { jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
        if (!metadata.format || !(metadata.format in mime) || mime[metadata.format] !== file.mimetype
            || !metadata.width || !metadata.height || metadata.width > 8192 || metadata.height > 8192 || (metadata.pages ?? 1) !== 1) {
            throw new Error("Invalid image");
        }
        // Decode fully and re-encode: metadata-only inspection does not validate pixels.
        const buffer = await image.rotate().webp({ quality: 90 }).toBuffer();
        if (buffer.length > 5 * 1024 * 1024)
            throw new Error("Encoded image too large");
        return buffer;
    }
    catch {
        throw new api_error_1.default(400, "Expected a valid, non-animated JPEG, PNG or WebP within image limits");
    }
};
exports.validateImage = validateImage;
const uploadImage = async (buffer, journal) => {
    const publicId = "nexora/products/" + (0, node_crypto_1.randomUUID)();
    await imageAsset_model_1.default.create({ publicId, state: "pending", retryAfter: new Date(Date.now() + 60 * 60 * 1000) });
    journal.push(publicId);
    return new Promise((resolve, reject) => {
        const stream = cloudinary_1.default.uploader.upload_stream({ public_id: publicId, resource_type: "image", overwrite: false, timeout: 60000 }, (error, result) => {
            if (error || !result?.secure_url || result.public_id !== publicId)
                reject(new api_error_1.default(502, "Image upload failed"));
            else
                resolve({ url: result.secure_url, publicId });
        });
        stream.on("error", () => reject(new api_error_1.default(502, "Image upload failed")));
        stream.end(buffer);
    });
};
exports.uploadImage = uploadImage;
const markAttached = async (ids) => {
    try {
        await imageAsset_model_1.default.updateMany({ publicId: { $in: ids } }, { $set: { state: "attached", lockedUntil: null } });
    }
    catch {
        console.warn("Image journal finalization deferred");
    }
};
exports.markAttached = markAttached;
const queueCleanup = async (ids, delayMs = 0, strict = false) => {
    for (const publicId of new Set(ids.filter(Boolean))) {
        try {
            await imageAsset_model_1.default.updateOne({ publicId }, { $set: { state: "cleanup", retryAfter: new Date(Date.now() + delayMs) }, $setOnInsert: { attempts: 0 } }, { upsert: true });
        }
        catch (error) {
            if (strict)
                throw error;
            console.warn("Image cleanup journal update deferred");
        }
    }
};
exports.queueCleanup = queueCleanup;
const drainImageCleanup = async () => {
    // Database outage fails closed: never delete an asset whose references cannot be checked.
    for (let i = 0; i < 25; i++) {
        const now = new Date();
        const asset = await imageAsset_model_1.default.findOneAndUpdate({ state: { $in: ["pending", "cleanup"] }, retryAfter: { $lte: now },
            $or: [{ lockedUntil: null }, { lockedUntil: { $lte: now } }] }, { $set: { lockedUntil: new Date(Date.now() + 60000) } }, { returnDocument: "after", sort: { retryAfter: 1 } });
        if (!asset)
            return;
        try {
            const referenced = await productImageSchema_1.default.exists({ $or: [{ primaryPublicId: asset.publicId }, { "thumbnails.publicId": asset.publicId }] });
            if (referenced) {
                asset.state = "attached";
                asset.lockedUntil = null;
                await asset.save();
                continue;
            }
            const result = await cloudinary_1.default.uploader.destroy(asset.publicId, { resource_type: "image", invalidate: true });
            if (!["ok", "not found"].includes(result.result))
                throw new Error("Cleanup was not confirmed");
            await imageAsset_model_1.default.deleteOne({ _id: asset._id });
        }
        catch {
            await imageAsset_model_1.default.updateOne({ _id: asset._id }, { $inc: { attempts: 1 }, $set: {
                    retryAfter: new Date(Date.now() + Math.min(3600000, 60000 * 2 ** Math.min(asset.attempts, 6))), lockedUntil: null,
                } });
        }
    }
};
exports.drainImageCleanup = drainImageCleanup;
const cleanupImages = async (ids) => {
    await (0, exports.queueCleanup)(ids);
    try {
        await (0, exports.drainImageCleanup)();
    }
    catch {
        console.warn("Image cleanup retry deferred");
    }
};
exports.cleanupImages = cleanupImages;
