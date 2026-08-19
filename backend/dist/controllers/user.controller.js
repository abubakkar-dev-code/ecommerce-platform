"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleCallback = exports.updatePassword = exports.updateProfile = exports.userProfile = exports.loginUser = exports.registerUser = void 0;
const api_error_1 = __importDefault(require("../utils/api-error"));
const user_model_1 = __importDefault(require("../models/user.model"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const api_response_1 = __importDefault(require("../utils/api-response"));
const jwt_1 = require("../utils/jwt");
const registerUser = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            throw new api_error_1.default(400, "Name,email and password are required");
        }
        const existingUser = await user_model_1.default.findOne({ email });
        if (existingUser) {
            throw new api_error_1.default(409, "User with email already exist");
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        const user = await user_model_1.default.create({
            name,
            email,
            password: hashedPassword,
        });
        res.status(201).json(new api_response_1.default("user registered successfully", user));
    }
    catch (error) {
        next(error);
    }
};
exports.registerUser = registerUser;
const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            throw new api_error_1.default(400, "name and email are required");
        }
        const user = await user_model_1.default.findOne({ email });
        if (!user) {
            throw new api_error_1.default(401, "user not found");
        }
        const isPasswordCorrect = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordCorrect) {
            throw new api_error_1.default(401, "Invalid credentials");
        }
        const token = (0, jwt_1.generateToken)(user._id.toString());
        res.status(200).json(new api_response_1.default("Login successfull", {
            user,
            token,
        }));
    }
    catch (error) {
        next(error);
    }
};
exports.loginUser = loginUser;
const userProfile = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await user_model_1.default.findById(userId).select("-password");
        if (!user) {
            throw new api_error_1.default(404, "user not found");
        }
        res.status(200).json(new api_response_1.default("Profile fetched successfully", user));
    }
    catch (error) {
        next(error);
    }
};
exports.userProfile = userProfile;
const updateProfile = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { name, email } = req.body;
        if (!name && !email) {
            throw new api_error_1.default(400, "name and email are required");
        }
        const user = await user_model_1.default.findById(userId);
        if (!user) {
            throw new api_error_1.default(404, "user not found");
        }
        if (email && email != user.email) {
            const existingUser = await user_model_1.default.findOne({ email });
            if (existingUser) {
                throw new api_error_1.default(409, "user with this email already exist");
            }
            user.email = email;
        }
        if (name) {
            user.name = name;
        }
        await user.save();
        res.status(201).json(new api_response_1.default("profile updated successfully", user));
    }
    catch (error) {
        next(error);
    }
};
exports.updateProfile = updateProfile;
const updatePassword = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            throw new api_error_1.default(400, "Current password and new password are required");
        }
        const user = await user_model_1.default.findById(userId);
        if (!user) {
            throw new api_error_1.default(404, "User not found");
        }
        const isCurrentPasswordCorrect = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isCurrentPasswordCorrect) {
            throw new api_error_1.default(401, "Current password is incorrect");
        }
        const isSamePassword = await bcryptjs_1.default.compare(newPassword, user.password);
        if (isSamePassword) {
            throw new api_error_1.default(400, "New password should be different from old password");
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 12);
        user.password = hashedPassword;
        await user.save();
        res
            .status(200)
            .json(new api_response_1.default("Password updated successfully", null));
    }
    catch (error) {
        next(error);
    }
};
exports.updatePassword = updatePassword;
const googleCallback = (req, res) => {
    const user = req.user;
    const token = (0, jwt_1.generateToken)(user._id.toString());
    res.json({
        message: "Google authentication successful",
        token,
    });
};
exports.googleCallback = googleCallback;
