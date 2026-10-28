import express from "express";
import {
  createImage,
  deletePrimaryImage,
  deleteThumbnails,
  getImages,
  updatePrimaryImage,
  updateThumbnails,
} from "../controllers/image.controller";
import upload from "../middleware/upload.middleware";

const router = express.Router();

router.post(
  "/:productId",
  upload.fields([
    { name: "primaryImage", maxCount: 1 },
    { name: "thumbnails", maxCount: 5 },
  ]),
  createImage,
);
router.get("/:productId", getImages);

router.patch(
  "/:productImageId",
  upload.single("primaryImage"),
  updatePrimaryImage,
);
router.patch(
  "/:productImageId",
  upload.array("thumbnails", 5),
  updateThumbnails,
);
router.delete("/:productImageId", deletePrimaryImage);
router.delete("/:productImageId/thumbnail", deleteThumbnails);
export default router;
