import express, { Request, Response } from "express";
import {
  loginUser,
  registerUser,
  updatePassword,
  updateProfile,
  userProfile,
} from "../controllers/user.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", authenticate, userProfile);
router.put("/update-profile", authenticate, updateProfile);
router.put("/update-password",authenticate, updatePassword);
export default router;
