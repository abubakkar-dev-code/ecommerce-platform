import express from "express";
import {
  createImage,
  deletePrimaryImage,
  deleteThumbnails,
  getImages,
  updatePrimaryImage,
  updateThumbnails,
  uploadError,
} from "../../controllers/image.controller";
import upload from "../../middleware/upload.middleware";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";

const router = express.Router();

router.post(
  "/:productId",
  authenticate,
  authorize("admin"),
  upload.fields([
    { name: "primaryImage", maxCount: 1 },
    { name: "thumbnails", maxCount: 5 },
  ]),
  createImage,
);
router.get("/:productId", getImages);

router.patch(
  "/:productImageId",
  authenticate,
  authorize("admin"),
  upload.single("primaryImage"),
  updatePrimaryImage,
);
router.patch(
  "/:productImageId/thumbnails",
  authenticate,
  authorize("admin"),
  upload.array("thumbnails", 5),
  updateThumbnails,
);
router.delete(
  "/:productImageId",
  authenticate,
  authorize("admin"),
  deletePrimaryImage,
);
router.delete(
  "/:productImageId/thumbnail",
  authenticate,
  authorize("admin"),
  deleteThumbnails,
);
router.use(uploadError);
export default router;
