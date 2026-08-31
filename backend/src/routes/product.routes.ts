import express from "express";
import {
  createProduct,
  deleteProduct,
  getProducts,
  getSingleProduct,
  seachProducts,
  updateProduct,
} from "../controllers/product.controller";
const router = express.Router();

router.post("/create-product", createProduct);
router.get("/", getProducts);
router.get("/search", seachProducts);
router.get("/:id", getSingleProduct);
router.patch("/:id", updateProduct);
router.delete("/:id", deleteProduct);
export default router;
