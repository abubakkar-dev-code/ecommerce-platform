import { NextFunction, Request, Response } from "express";
import ApiError from "../utils/api-error";
import User from "../models/user.model";
import bcrypt from "bcryptjs";
import ApiResponse from "../utils/api-response";
import { generateToken } from "../utils/jwt";

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
    const userId = req.user.userId;
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
    const userId = req.user.userId;
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
    const userId = req.user.userId;

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
