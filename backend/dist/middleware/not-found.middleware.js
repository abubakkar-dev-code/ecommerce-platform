"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const api_error_1 = __importDefault(require("../utils/api-error"));
const notFound = (req, _res, next) => {
    next(new api_error_1.default(404, `Route not found ${req.method},${req.url}`));
};
exports.default = notFound;
