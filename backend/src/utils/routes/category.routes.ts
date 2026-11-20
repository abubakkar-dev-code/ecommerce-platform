import express from "express";
import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategoriesBySlug,
  updateCategories,
} from "../../controllers/category.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
const router = express.Router();
router.post(
  "/create-category",
  authenticate,
  authorize("admin"),
  createCategory,
);
router.get("/", getCategories);
router.get("/:slug", getCategoriesBySlug);
router.patch("/:id", authenticate, authorize("admin"), updateCategories);
router.delete("/:id", authenticate, authorize("admin"), deleteCategory);
export default router;
