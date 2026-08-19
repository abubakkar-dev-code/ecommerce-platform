import express from "express";
import {
  forgotPassword,
  googleCallback,
  loginUser,
  logout,
  registerUser,
  resetPassword,
  updatePassword,
  updateProfile,
  userProfile,
} from "../controllers/user.controller";
import { authenticate } from "../middleware/auth.middleware";
import passport from "../config/passport";
import { forgotPasswordLimiter } from "../middleware/rateLimitMiddleware";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", authenticate, userProfile);
router.put("/update-profile", authenticate, updateProfile);
router.put("/update-password", authenticate, updatePassword);
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
  }),
  googleCallback,
);
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
export default router;
router.put("/reset-password", resetPassword);
router.post("/logout",logout);
