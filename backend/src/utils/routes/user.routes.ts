import express from "express";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { authCookieOptions } from "../../config/browser-auth";
import ApiError from "../../utils/api-error";
import { requestEmailVerification, verifyEmail } from "../../controllers/emailVerification.controller";
import {
  forgotPassword,
  googleCallback,
  loginUser,
  logout,
  logoutAll,
  logoutDevice,
  listSessions,
  refresh,
  registerUser,
  resetPassword,
  updatePassword,
  updateProfile,
  userProfile,
} from "../../controllers/user.controller";
import { authenticate } from "../../middleware/auth.middleware";
import passport from "../../config/passport";
import { authLimiter, emailVerificationLimiter, forgotPasswordLimiter } from "../../middleware/rateLimitMiddleware";

const router = express.Router();

router.post("/register", authLimiter, registerUser);
router.post("/login", authLimiter, loginUser);
router.get("/profile", authenticate, userProfile);
router.put("/update-profile", authenticate, updateProfile);
router.put("/update-password", authenticate, updatePassword);
const stateCookie = "google_oauth_state";
const stateOptions = { ...authCookieOptions, path: "/api/users/google/callback" };

router.get("/google", authLimiter, (req, res, next) => {
  const state = randomBytes(32).toString("hex");
  res.cookie(stateCookie, state, { ...stateOptions, maxAge: 10 * 60 * 1000 });
  passport.authenticate("google", { scope: ["profile", "email"], state, session: false })(req, res, next);
});
router.get("/google/callback", authLimiter, (req, res, next) => {
  const expected = req.cookies?.[stateCookie];
  const provided = req.query.state;
  res.clearCookie(stateCookie, stateOptions);
  if (typeof expected !== "string" || typeof provided !== "string" ||
      !/^[a-f\d]{64}$/.test(expected) || !/^[a-f\d]{64}$/.test(provided) ||
      !timingSafeEqual(Buffer.from(expected), Buffer.from(provided))) {
    return next(new ApiError(400, "Google sign-in state is invalid or expired"));
  }
  next();
}, passport.authenticate("google", { session: false }), googleCallback);
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.put("/reset-password", authLimiter, resetPassword);
router.post("/refresh", authLimiter, refresh);
router.post("/email-verification", authenticate, emailVerificationLimiter, requestEmailVerification);
router.post("/verify-email", authLimiter, verifyEmail);
router.post("/logout", logout);
router.post("/logout-all", authenticate, logoutAll);
router.get("/sessions", authenticate, listSessions);
router.delete("/sessions/:id", authenticate, logoutDevice);
export default router;
