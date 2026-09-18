"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.resetPassword = exports.forgotPassword = exports.googleCallback = exports.updatePassword = exports.updateProfile = exports.userProfile = exports.loginUser = exports.registerUser = void 0;
const api_error_1 = __importDefault(require("../utils/api-error"));
const user_model_1 = __importDefault(require("../models/user.model"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const api_response_1 = __importDefault(require("../utils/api-response"));
const jwt_1 = require("../utils/jwt");
const authToken_1 = __importDefault(require("../models/authToken"));
const sendmail_1 = require("../services/sendmail");
const resetTokenGeneration_1 = require("../config/resetTokenGeneration");
const resetTokenHash_1 = require("../config/resetTokenHash");
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
            throw new api_error_1.default(400, "user not found");
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
    res.redirect(`http://localhost:5173/google-success?token=${token}`);
    // res.json({
    //   message: "Google authentication successful",
    //   token,
    // });
};
exports.googleCallback = googleCallback;
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            throw new api_error_1.default(404, "email is required");
        }
        const user = await user_model_1.default.findOne({ email });
        if (!user) {
            res
                .status(200)
                .json(new api_response_1.default("If this email is registered,a passowrd reset link has been sent to our email "));
            return;
        }
        const resetToken = (0, resetTokenGeneration_1.resetTokenGeneration)();
        const hashedToken = (0, resetTokenHash_1.resetTokenHash)(resetToken);
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        await authToken_1.default.create({
            userId: user._id,
            token: hashedToken,
            expiresAt,
        });
        const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;
        await (0, sendmail_1.passwordResetLink)(user.email, resetLink);
        res
            .status(200)
            .json(new api_response_1.default("If this email is registered,a passowrd reset link has been sent to our email "));
    }
    catch (error) {
        next(error);
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res, next) => {
    try {
        const token = req.query.token;
        const { newPassword, confirmPassword } = req.body;
        if (!token) {
            throw new api_error_1.default(404, "invalid request token must be required");
        }
        if (!newPassword || !confirmPassword) {
            throw new api_error_1.default(400, "new password and confirm password are required");
        }
        if (newPassword != confirmPassword) {
            throw new api_error_1.default(400, "Password do not match");
        }
        const hashedToken = (0, resetTokenHash_1.resetTokenHash)(token);
        const resetRecord = await authToken_1.default.findOne({ token: hashedToken });
        if (!resetRecord) {
            throw new api_error_1.default(400, "no records found");
        }
        if (resetRecord.expiresAt < new Date()) {
            await authToken_1.default.deleteOne({
                _id: resetRecord._id,
            });
            throw new api_error_1.default(400, "Token expired. please request a new one");
        }
        const user = await user_model_1.default.findById(resetRecord.userId);
        if (!user) {
            throw new api_error_1.default(404, "User not found");
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 12);
        user.password = hashedPassword;
        await user.save();
        res.status(201).json(new api_response_1.default("Password reset successfully", user));
    }
    catch (error) {
        next(error);
    }
};
exports.resetPassword = resetPassword;
const logout = (_req, res) => {
    res.status(200).json(new api_response_1.default("Logout successfull"));
};
exports.logout = logout;
