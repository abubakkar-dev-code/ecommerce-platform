import express from "express";
import {
  createProductVariant,
  deleteVarient,
  getVarient,
  getVrientById,
  updatevarient,
} from "../controllers/productVariant.controller";
const router = express.Router();

router.post("/create-varient", createProductVariant);
router.get("/:id", getVarient);
router.get("/getSingleVarient/:id", getVrientById);
router.patch("/:id", updatevarient);
router.delete("/:id", deleteVarient);

export default router;
