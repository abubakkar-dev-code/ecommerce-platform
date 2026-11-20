"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const api_error_1 = __importDefault(require("../utils/api-error"));
// Buffer only after route authentication/authorization; no provider calls here.
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    fileFilter: (_req, file, callback) => {
        if (["image/jpeg", "image/png", "image/webp"].includes(file.mimetype))
            callback(null, true);
        else
            callback(new api_error_1.default(400, "Only JPEG, PNG and WebP images are allowed"));
    },
    limits: { fileSize: 5 * 1024 * 1024, files: 6, fields: 2, fieldSize: 512, parts: 8 },
});
exports.default = upload;
