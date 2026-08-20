import express from "express";
import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategoriesBySlug,
  updateCategories,
} from "../controllers/category.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/authorize.middleware";
const router = express.Router();
router.post(
  "/create-category",
  authenticate,
  authorize("admin"),
  createCategory,
);
router.get("/", getCategories);
router.get("/:slug", getCategoriesBySlug);
router.patch("/:id", authenticate, authorize, updateCategories);
router.delete("/:id", authenticate, authorize, deleteCategory);
export default router;
