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
router.get("/get-varient", getVarient);
router.get("/get-varient/:id", getVrientById);
router.patch("/update-varient", updatevarient);
router.delete("/delete-varient", deleteVarient);

export default router;
