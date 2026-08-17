import { Request, Response, NextFunction } from "express";
import ApiError from "../utils/api-error";
const notFound = (req: Request, _res: Response, next: NextFunction): void => {
  next(new ApiError(404, `Route not found ${req.method},${req.url}`));
};
export default notFound