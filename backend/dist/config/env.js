"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const requiredEnvVariables = [
    "MONGODB_URI",
    "JWT_SECRET",
    "JWT_EXPIRES_IN",
    "CLIENT_ID",
    "CLIENT_SECRET",
    "CLIENT_CALLBACK_URI",
];
for (const variable of requiredEnvVariables) {
    if (!process.env[variable]) {
        throw new Error(`Missing required Enviroment variables ${variable}`);
    }
}
exports.env = {
    NODE_ENV: process.env.NODE_ENV || "development",
    port: process.env.PORT || 5000,
    mongodbUri: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    CLIENT_ID: process.env.CLIENT_ID,
    CLIENT_SECRET: process.env.CLIENT_SECRET,
    CLIENT_CALLBACK_URI: process.env.CLIENT_CALLBACK_URI,
};
