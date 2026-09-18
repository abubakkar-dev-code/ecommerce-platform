"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const api_error_js_1 = __importDefault(require("../utils/api-error.js"));
const errorMiddleware = (error, _req, res, _next) => {
    if (error instanceof api_error_js_1.default) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
        });
        return;
    }
    console.error(error);
    res.status(500).json({
        success: false,
        message: `Internal server error ${error.message}`,
    });
};
exports.default = errorMiddleware;
