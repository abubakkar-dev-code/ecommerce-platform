import express from "express";
import rateLimit from "express-rate-limit";
import { chat, getProductRecommendations } from "../../controllers/ai.controller";

const router = express.Router();
const aiRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: "Too many AI requests. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/chat", aiRequestLimiter, chat);
router.post("/recommendations", aiRequestLimiter, getProductRecommendations);

export default router;
