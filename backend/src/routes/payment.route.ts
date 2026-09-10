import express from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  createPayment,
  verifyPayment,
} from "../controllers/payment.controller";
const router = express.Router();

router.post("/", authenticate, createPayment);
router.post("/verify", authenticate, verifyPayment);
export default router;
