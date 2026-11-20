import type { Request, Response, NextFunction } from "express";
import { randomBytes, createHash } from "node:crypto";
import User from "../models/user.model";
import EmailVerification from "../models/emailVerification.model";
import { verificationEmail } from "../services/sendmail";
import { stockTransaction } from "../services/inventory.service";
import { toUserDto } from "../dto/user.dto";
import ApiError from "../utils/api-error";
import ApiResponse from "../utils/api-response";

const hash = (token: string) => createHash("sha256").update(token).digest("hex");
const invalid = () => new ApiError(400, "Verification link is invalid or expired");

export async function requestEmailVerification(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await User.findById(req.user!.userId!);
    if (!user?.isActive) throw new ApiError(401, "Account is unavailable");
    if (user.emailVerifiedAt) {
      res.json(new ApiResponse("Email already verified"));
      return;
    }
    const token = randomBytes(32).toString("hex");
    const link = new URL("/verify-email", process.env.STOREFRONT_URL || "http://localhost:5173");
    link.hash = new URLSearchParams({ token }).toString();
    const verification = await EmailVerification.create({
      user: user._id, email: user.email, tokenHash: hash(token), expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });
    try {
      await verificationEmail(user.email, link.href);
    } catch {
      await verification.deleteOne();
      throw new ApiError(502, "Verification email could not be sent. Try again later.");
    }
    res.json(new ApiResponse("Verification email sent"));
  } catch (error) { next(error); }
}

export async function verifyEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.body?.token;
    if (typeof token !== "string" || !/^[a-f\d]{64}$/.test(token)) throw invalid();
    const user = await stockTransaction(async (session) => {
      const verification = await EmailVerification.findOneAndDelete({
        tokenHash: hash(token), expiresAt: { $gt: new Date() },
      }).session(session);
      if (!verification) return null;
      return User.findOneAndUpdate({ _id: verification.user, email: verification.email, isActive: true },
        { $set: { emailVerifiedAt: new Date() } }, { returnDocument: "after", session });
    });
    if (!user) throw invalid();
    res.setHeader("Cache-Control", "no-store");
    res.json(new ApiResponse("Email verified", toUserDto(user)));
  } catch (error) { next(error); }
}
