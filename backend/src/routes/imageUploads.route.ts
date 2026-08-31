import express from "express";
import {
  createImage,
  deleteImageById,
  getProductImages,
  updateImageById,
} from "../controllers/image.controller";
import upload from "../middleware/upload";

const router = express.Router();

router.post("/:productId", upload.single("image"), createImage);
router.get("/:productId", getProductImages);
router.patch("/:imageId", upload.single("image"), updateImageById);
router.delete("/:imageId" ,deleteImageById);

export default router;
