"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
// Durable asset journal: an upload is recorded before contacting Cloudinary.
const imageAssetSchema = new mongoose_1.Schema({
    publicId: { type: String, required: true, unique: true },
    state: { type: String, enum: ["pending", "attached", "cleanup"], required: true },
    attempts: { type: Number, default: 0 },
    retryAfter: { type: Date, required: true },
    lockedUntil: { type: Date, default: null },
}, { timestamps: true });
imageAssetSchema.index({ state: 1, retryAfter: 1, lockedUntil: 1 });
exports.default = (0, mongoose_1.model)("ImageAsset", imageAssetSchema);
