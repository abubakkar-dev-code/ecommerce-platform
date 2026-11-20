"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authCookieOptions = exports.authCookieName = exports.browserOrigins = void 0;
exports.browserOrigins = (process.env.CLIENT_ORIGINS || "http://localhost:5173,http://localhost:5174,https://ecommerce-platform-five-liard.vercel.app")
    .split(",").map((value) => value.trim()).filter(Boolean);
exports.authCookieName = "access_token";
exports.authCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api",
};
