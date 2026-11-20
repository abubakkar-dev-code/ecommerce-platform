import { Request, Response, NextFunction } from "express";
import ApiError from "../utils/api-error.js";

const errorMiddleware = (
  error: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
    return;
  }

  if ("type" in error && (error.type === "entity.parse.failed" || error.type === "entity.too.large")) {
    const tooLarge = error.type === "entity.too.large";
    res.status(tooLarge ? 413 : 400).json({ success: false, message: tooLarge ? "Request body too large" : "Invalid JSON" });
    return;
  }

  console.error("Unhandled request failure", { name: error.name });

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};

export default errorMiddleware;
