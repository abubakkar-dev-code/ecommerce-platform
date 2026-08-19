declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
      };
    }
  }
}
export interface jwtPayload {
  userId: string;
}
import { NextFunction, Request, Response } from "express";
import ApiError from "../utils/api-error";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  try {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "Authentication token is required");
    }
    const token = authHeader.split(" ")[1];
    console.log("Token:", token);
    console.log("JWT_SECRET:", env.JWT_SECRET);
    const decoded = jwt.verify(token, env.JWT_SECRET) as jwtPayload;
    console.log("Decoded:", decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.log("Auth Error:", error);
    next(new ApiError(401, "Invalid request or token expired"));
  }
};
