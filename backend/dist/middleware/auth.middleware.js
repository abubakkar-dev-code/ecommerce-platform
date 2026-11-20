"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const api_error_1 = __importDefault(require("../utils/api-error"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const user_model_1 = __importDefault(require("../models/user.model"));
const browser_auth_1 = require("../config/browser-auth");
const authenticate = async (req, _res, next) => {
    const authHeader = req.headers.authorization;
    try {
        const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : req.cookies?.[browser_auth_1.authCookieName];
        if (!token) {
            throw new api_error_1.default(401, "Authentication token is required");
        }
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        const user = await user_model_1.default.findById(decoded.userId);
        if (!user) {
            throw new api_error_1.default(401, "Account is unavailable");
        }
        if (user.isActive !== true) {
            throw new api_error_1.default(403, "Account is disabled");
        }
        req.user = decoded;
        next();
    }
    catch (error) {
        if (error instanceof api_error_1.default) {
            next(error);
            return;
        }
        console.log("Auth Error:", error);
        next(new api_error_1.default(401, "Invalid request or token expired"));
    }
};
exports.authenticate = authenticate;
