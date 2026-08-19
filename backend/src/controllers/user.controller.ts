import { NextFunction, Request, Response } from "express";
import ApiError from "../utils/api-error";
import User, { IUser } from "../models/user.model";
import bcrypt from "bcryptjs";
import ApiResponse from "../utils/api-response";
import { generateToken } from "../utils/jwt";
import crypto from "crypto";
import AuthToken from "../models/authToken";
import { passwordResetLink } from "../services/sendmail";
import { resetTokenGeneration } from "../config/resetTokenGeneration";
import { resetTokenHash } from "../config/resetTokenHash";

export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      throw new ApiError(400, "Name,email and password are required");
    }
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
    res.status(201).json(new ApiResponse("user registered successfully", user));
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
    const { email, password } = req.body;
    if (!email || !password) {
      throw new ApiError(400, "name and email are required");
    }
    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(401, "user not found");
    }
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      throw new ApiError(401, "Invalid credentials");
    }
    const token = generateToken(user._id.toString());
    res.status(200).json(
      new ApiResponse("Login successfull", {
        user,
        token,
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
    const user = await User.findById(userId).select("-password");
    if (!user) {
      throw new ApiError(404, "user not found");
    }
    res.status(200).json(new ApiResponse("Profile fetched successfully", user));
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
    const { name, email } = req.body;
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
    }
    if (name) {
      user.name = name;
    }
    await user.save();
    res.status(201).json(new ApiResponse("profile updated successfully", user));
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

    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
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

    res
      .status(200)
      .json(new ApiResponse("Password updated successfully", null));
  } catch (error) {
    next(error);
  }
};
export const googleCallback = (req: Request, res: Response): void => {
  const user = req.user as unknown as IUser;
  const token = generateToken(user!._id.toString());
  res.json({
    message: "Google authentication successful",
    token,
  });
};
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new ApiError(404, "email is required");
    }
    const user = await User.findOne({ email });
    if (!user) {
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
    const resetLink = `http://localhost:5000/api/users/reset-password?token=${resetToken}`;
    await passwordResetLink(user.email, resetLink);
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
    const token = req.query.token as string;
    const { newPassword, confirmPassword } = req.body;
    if (!token) {
      throw new ApiError(404, "invalid request token must be required");
    }
    if (!newPassword || !confirmPassword) {
      throw new ApiError(400, "new password and confirm password are required");
    }
    if (newPassword != confirmPassword) {
      throw new ApiError(400, "Password do not match");
    }
    const hashedToken = resetTokenHash(token);
    const resetRecord = await AuthToken.findOne({ token: hashedToken });
    if (!resetRecord) {
      throw new ApiError(400, "no records found");
    }
    if (resetRecord.expiresAt < new Date()) {
      await AuthToken.deleteOne({
        _id: resetRecord._id,
      });
      throw new ApiError(400, "Token expired. please request a new one");
    }
    const user = await User.findById(resetRecord.userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    await user.save();
    res.status(201).json(new ApiResponse("Password reset successfully", user));
  } catch (error) {
    next(error);
  }
};
export const logout = (_req: Request, res: Response): void => {
  res.status(200).json(new ApiResponse("Logout successfull"));
};
