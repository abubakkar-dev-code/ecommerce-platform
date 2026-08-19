import rateLimit from "express-rate-limit";

export const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: "Too many password reset requests. Please try again later.",
  standardHeaders: true,

  legacyHeaders: false,
});
