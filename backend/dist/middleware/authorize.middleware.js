"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const api_error_1 = __importDefault(require("../utils/api-error"));
const authorize = (requiredRole) => {
    return async (req, _res, next) => {
        try {
            const userId = req.user?.userId;
            const user = await user_model_1.default.findById(userId);
            if (!user) {
                throw new api_error_1.default(404, "User not found");
            }
            if (user.role !== requiredRole) {
                throw new api_error_1.default(401, "Access Restricted");
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.authorize = authorize;
