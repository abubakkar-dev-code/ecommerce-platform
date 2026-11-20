"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const ai_controller_1 = require("../../controllers/ai.controller");
const router = express_1.default.Router();
const aiRequestLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    message: "Too many AI requests. Please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
});
router.post("/chat", aiRequestLimiter, ai_controller_1.chat);
router.post("/recommendations", aiRequestLimiter, ai_controller_1.getProductRecommendations);
exports.default = router;
