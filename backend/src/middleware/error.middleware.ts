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

  console.error(error);

  res.status(500).json({
    success: false,
    message: `Internal server error ${error.message}`,
  });
};

export default errorMiddleware;
