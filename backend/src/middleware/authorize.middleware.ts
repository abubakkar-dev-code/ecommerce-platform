import { NextFunction, Request,Response} from "express";
import User from "../models/user.model";
import ApiError from "../utils/api-error";

export const authorize = (requiredRole: "customer" | "admin") => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const user = await User.findById(userId);
      if (!user) {
        throw new ApiError(404, "User not found");
      }
      if (user.role !== requiredRole) {
        throw new ApiError(401, "Access Restricted");
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
