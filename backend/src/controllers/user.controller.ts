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
    res.status(200).json(new ApiResponse("Login successfull",{
      user,
      token
    }));
  } catch (error) {
    next(error);
  }
};
