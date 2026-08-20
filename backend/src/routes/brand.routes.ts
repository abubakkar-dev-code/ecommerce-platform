import express from "express";
import {
  createBrand,
  deleteBrand,
  getBrands,
  updateBrand,
} from "../controllers/brand.controller";
import { authorize } from "../middleware/authorize.middleware";
import { authenticate } from "../middleware/auth.middleware";

const router = express.Router();
router.get("/", getBrands);
router.post("/create-brand", authenticate, authorize("admin"), createBrand);
router.patch("/:id", authenticate, authorize, updateBrand);
router.delete("/:id",deleteBrand);

export default router;
