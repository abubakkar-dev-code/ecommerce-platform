import { NextFunction, Request, Response } from "express";
import ApiError from "../utils/api-error";
import User from "../models/user.model";
import bcrypt from "bcryptjs";
import ApiResponse from "../utils/api-response";
import { generateToken } from "../utils/jwt";
import AuthToken from "../models/authToken";
import { passwordResetLink } from "../services/sendmail";
import { resetTokenGeneration } from "../config/resetTokenGeneration";
import { resetTokenHash } from "../config/resetTokenHash";
import { toUserDto } from "../dto/user.dto";
import { z } from "zod";
import Session from "../models/session.model";
import { clearSessionCookies, logoutSession, revokeAllSessions, revokeSession, rotateSession, startSession } from "../services/session.service";
import { objectId, parse } from "../validation/catalog.validation";

const accountEmail = z.string().trim().toLowerCase().email().max(254);
const accountPassword = z.string().min(8).refine((value) => Buffer.byteLength(value) <= 72);
const accountName = z.string().trim().min(1).max(160);
const registration = z.object({ name: accountName, email: accountEmail, password: accountPassword });
const credentials = z.object({ email: accountEmail, password: z.string().min(1).max(256) });

export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, email, password } = parse(registration, req.body);
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(409, "User with email already exist");
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });
    res.status(201).json(new ApiResponse("user registered successfully", toUserDto(user)));
  } catch (error) {
    next(error);
  }
};
export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, password } = parse(credentials, req.body);
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      throw new ApiError(400, "user not found");
    }
    if (user.isActive !== true) {
      throw new ApiError(403, "Account is disabled");
    }
    if (!user.password) {
      throw new ApiError(401, "Invalid credentials");
    }
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      throw new ApiError(401, "Invalid credentials");
    }
    const cookieMode = req.get("X-Auth-Mode") === "cookie";
    if (cookieMode) await startSession(String(user._id), res);
    const token = cookieMode ? undefined : generateToken(String(user._id));
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(
      new ApiResponse("Login successfull", {
        user: toUserDto(user),
        ...(cookieMode ? {} : { token }),
      }),
    );
  } catch (error) {
    next(error);
  }
};

export const userProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "user not found");
    }
    res.status(200).json(new ApiResponse("Profile fetched successfully", toUserDto(user)));
  } catch (error) {
    next(error);
  }
};
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { name, email } = parse(z.object({ name: accountName.optional(), email: accountEmail.optional() }), req.body);
    if (!name && !email) {
      throw new ApiError(400, "name and email are required");
    }
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "user not found");
    }
    if (email && email != user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new ApiError(409, "user with this email already exist");
      }
      user.email = email;
      user.emailVerifiedAt = undefined;
    }
    if (name) {
      user.name = name;
    }
    await user.save();
    res.status(201).json(new ApiResponse("profile updated successfully", toUserDto(user)));
  } catch (error) {
    next(error);
  }
};
export const updatePassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new ApiError(400, "Current password and new password are required");
    }

    const user = await User.findById(userId).select("+password");

    if (!user) {
      throw new ApiError(404, "User not found");
    }
    if (!user.password) {
      throw new ApiError(401, "Invalid credentials");
    }

    const isCurrentPasswordCorrect = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isCurrentPasswordCorrect) {
      throw new ApiError(401, "Current password is incorrect");
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);

    if (isSamePassword) {
      throw new ApiError(
        400,
        "New password should be different from old password",
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    user.password = hashedPassword;

    await user.save();
    await revokeAllSessions(String(user._id));
    clearSessionCookies(res);

    res
      .status(200)
      .json(new ApiResponse("Password updated successfully", null));
  } catch (error) {
    next(error);
  }
};
export const googleCallback = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      throw new ApiError(401, "Account is unavailable");
    }
    // Recheck after Passport: the account may have changed during OAuth.
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(401, "Account is unavailable");
    }
    if (user.isActive !== true) {
      throw new ApiError(403, "Account is disabled");
    }
    await startSession(String(user._id), res);
    res.redirect(new URL("/", process.env.STOREFRONT_URL || "http://localhost:5173").href);
  } catch (error) {
    next(error);
  }
};
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    if (!email || email.length > 254) throw new ApiError(400, "Email is required");
    const user = await User.findOne({ email });
    if (!user || user.isActive !== true) {
      res
        .status(200)
        .json(
          new ApiResponse(
            "If this email is registered,a passowrd reset link has been sent to our email ",
          ),
        );
      return;
    }
    const resetToken = resetTokenGeneration();
    const hashedToken = resetTokenHash(resetToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await AuthToken.create({
      userId: user._id,
      token: hashedToken,
      expiresAt,
    });
    const resetLink = new URL("/reset-password", process.env.STOREFRONT_URL || "http://localhost:5173");
    resetLink.searchParams.set("token", resetToken);
    try {
      await passwordResetLink(user.email, resetLink.href);
    } catch {
      console.error("Password reset email delivery failed");
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          "If this email is registered,a passowrd reset link has been sent to our email ",
        ),
      );
  } catch (error) {
    next(error);
  }
};
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = req.query.token;
    const { newPassword, confirmPassword } = req.body ?? {};
    if (typeof token !== "string" || !/^[a-f\d]{64}$/i.test(token)) {
      throw new ApiError(400, "Reset link is invalid or expired");
    }
    if (typeof newPassword !== "string" || newPassword.length < 8 || Buffer.byteLength(newPassword) > 72) {
      throw new ApiError(400, "Use a password with at least 8 characters and at most 72 bytes");
    }
    if (newPassword !== confirmPassword) throw new ApiError(400, "Passwords do not match");
    const hashedToken = resetTokenHash(token);
    if (!(await AuthToken.exists({ token: hashedToken, expiresAt: { $gt: new Date() } }))) {
      throw new ApiError(400, "Reset link is invalid or expired");
    }
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const resetRecord = await AuthToken.findOneAndDelete({ token: hashedToken, expiresAt: { $gt: new Date() } });
    if (!resetRecord) throw new ApiError(400, "Reset link is invalid or expired");
    const user = await User.findById(resetRecord.userId);
    if (!user || user.isActive !== true) throw new ApiError(400, "Reset link is invalid or expired");
    user.password = hashedPassword;
    await user.save();
    await revokeAllSessions(String(user._id));
    clearSessionCookies(res);
    res.status(201).json(new ApiResponse("Password reset successfully", toUserDto(user)));
  } catch (error) {
    next(error);
  }
};
export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await rotateSession(req, res);
    res.json(new ApiResponse("Session refreshed", toUserDto(user)));
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 401) clearSessionCookies(res);
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await logoutSession(req);
    clearSessionCookies(res);
    res.json(new ApiResponse("Logged out"));
  } catch (error) { next(error); }
};

export const logoutAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await revokeAllSessions(req.user!.userId!);
    clearSessionCookies(res);
    res.json(new ApiResponse("Browser sessions revoked"));
  } catch (error) { next(error); }
};

export const listSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessions = await Session.find({ user: req.user!.userId!, revokedAt: null, expiresAt: { $gt: new Date() } })
      .select("createdAt updatedAt expiresAt").sort({ updatedAt: -1 }).limit(50).lean();
    res.setHeader("Cache-Control", "no-store");
    res.json(new ApiResponse("Browser sessions", sessions.map((session) => ({
      ...session, current: String(session._id) === req.user?.sessionId,
    }))));
  } catch (error) { next(error); }
};

export const logoutDevice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parse(objectId, req.params.id);
    await revokeSession(id, req.user!.userId!);
    if (id === req.user?.sessionId) clearSessionCookies(res);
    res.json(new ApiResponse("Browser session revoked"));
  } catch (error) { next(error); }
};
