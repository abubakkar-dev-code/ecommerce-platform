"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const api_error_1 = __importDefault(require("../utils/api-error"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const authenticate = (req, _res, next) => {
    const authHeader = req.headers.authorization;
    try {
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new api_error_1.default(401, "Authentication token is required");
        }
        const token = authHeader.split(" ")[1];
        console.log("Token:", token);
        console.log("JWT_SECRET:", env_1.env.JWT_SECRET);
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        console.log("Decoded:", decoded);
        req.user = decoded;
        next();
    }
    catch (error) {
        console.log("Auth Error:", error);
        next(new api_error_1.default(401, "Invalid request or token expired"));
    }
};
exports.authenticate = authenticate;
