import express from "express";
import {
  cancelOrder,
  createOrder,
  getOrders,
  getSingleOrder,
} from "../controllers/order.controller";
import { authenticate } from "../middleware/auth.middleware";
const router = express.Router();
router.post("/", authenticate, createOrder);
router.get("/", authenticate, getOrders);
router.get("/:orderId", authenticate, getSingleOrder);
router.patch("/:orderId", authenticate, cancelOrder);

export default router;
