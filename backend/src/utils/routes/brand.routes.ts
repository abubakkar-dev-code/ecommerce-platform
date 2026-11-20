import express from "express";
import {
  createBrand,
  deleteBrand,
  getBrandById,
  getBrands,
  updateBrand,
} from "../../controllers/brand.controller";
import { authorize } from "../../middleware/authorize.middleware";
import { authenticate } from "../../middleware/auth.middleware";

const router = express.Router();
router.get("/", getBrands);
router.get("/:id", getBrandById);
router.post("/create-brand", authenticate, authorize("admin"), createBrand);
router.patch("/:id", authenticate, authorize("admin"), updateBrand);
router.delete("/:id", authenticate, authorize("admin"), deleteBrand);

export default router;
