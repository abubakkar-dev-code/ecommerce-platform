import type { CookieOptions } from "express";

const configuredOrigins = process.env.CLIENT_ORIGINS?.trim();
if (process.env.NODE_ENV === "production" && !configuredOrigins) throw new Error("CLIENT_ORIGINS is required in production");
export const browserOrigins = (configuredOrigins || "http://localhost:5173,http://localhost:5174")
  .split(",").map((value) => value.trim()).filter(Boolean);
export const authCookieName = "access_token";
export const authCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/api",
};
