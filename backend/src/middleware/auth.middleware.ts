declare global {
  namespace Express {
    interface User {
      // Passport supplies a MongoDB user; JWT authentication supplies userId.
      _id?: import("mongoose").Types.ObjectId;
      userId?: string;
    sessionId?: string;
    }
  }
}
export interface jwtPayload {
  userId: string;
  sessionId?: string;
}
import { NextFunction, Request, Response } from "express";
import ApiError from "../utils/api-error";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import User from "../models/user.model";
import Session from "../models/session.model";
import { authCookieName } from "../config/browser-auth";

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  try {
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : req.cookies?.[authCookieName];
    if (!token) {
      throw new ApiError(401, "Authentication token is required");
    }
    const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] }) as jwtPayload;
    if (!decoded || typeof decoded.userId !== "string" || !/^[a-f\d]{24}$/i.test(decoded.userId)) {
      throw new ApiError(401, "Invalid request or token expired");
    }
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new ApiError(401, "Account is unavailable");
    }
    if (user.isActive !== true) {
      throw new ApiError(403, "Account is disabled");
    }
    if (decoded.sessionId && !(await Session.exists({
      _id: decoded.sessionId, user: decoded.userId, expiresAt: { $gt: new Date() }, revokedAt: null,
    }))) throw new ApiError(401, "Session expired");
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
      return;
    }
    next(error instanceof jwt.JsonWebTokenError ? new ApiError(401, "Invalid request or token expired") : error);
  }
};
