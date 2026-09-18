"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = require("multer");
const multer_2 = __importDefault(require("multer"));
const storage = (0, multer_1.memoryStorage)();
const upload = (0, multer_2.default)({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});
exports.default = upload;
