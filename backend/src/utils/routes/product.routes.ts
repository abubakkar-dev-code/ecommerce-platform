import express from "express";
import {
  createProduct,
  deleteProduct,
  filterProducts,
  getProducts,
  getSingleProduct,
  searchProducts,
  updateProduct,
} from "../../controllers/product.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";

const router = express.Router();

router.post("/create-product", authenticate, authorize("admin"), createProduct);
router.get("/", getProducts);
router.get("/search", searchProducts);
router.get("/filter", filterProducts);
router.get("/:id", getSingleProduct);
router.patch("/:id", authenticate, authorize("admin"), updateProduct);
router.delete("/:id", authenticate, authorize("admin"), deleteProduct);
export default router;
