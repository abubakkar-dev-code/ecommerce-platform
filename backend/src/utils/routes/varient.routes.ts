import express from "express";
import {
  createProductVariant,
  deleteVarient,
  getVarient,
  getVrientById,
  updatevarient,
} from "../../controllers/productVariant.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";

const router = express.Router();

router.post(
  "/create-varient",
  authenticate,
  authorize("admin"),
  createProductVariant,
);
router.get("/:id", getVarient);
router.get("/getSingleVarient/:id", getVrientById);
router.patch("/:id", authenticate, authorize("admin"), updatevarient);
router.delete("/:id", authenticate, authorize("admin"), deleteVarient);

export default router;
