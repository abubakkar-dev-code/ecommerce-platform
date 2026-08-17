import express, { Request, Response } from "express";
import ApiResponse from "../utils/api-response";
const router = express.Router();

router.get("/", (_req: Request, res: Response) => {
  res.status(200).json(
    new ApiResponse("API is Healthy", {
      status: "okay",
      timeStamp: new Date().toISOString(),
    }),
  );
});
export default router;
