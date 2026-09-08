import express from "express";
import {
  createWishList,
  getwishList,
  removeWishList,
} from "../controllers/wishList.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = express.Router();

router.post("/:productId", authenticate, createWishList);
router.get("/", authenticate, getwishList);
router.delete("/:productId", authenticate, removeWishList);

export default router;
