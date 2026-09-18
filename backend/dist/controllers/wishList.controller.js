"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearWishList = exports.removeWishList = exports.getwishList = exports.createWishList = void 0;
const api_error_1 = __importDefault(require("../utils/api-error"));
const whistlist_model_1 = __importDefault(require("../models/whistlist.model"));
const api_response_1 = __importDefault(require("../utils/api-response"));
const product_model_1 = __importDefault(require("../models/product.model"));
const createWishList = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new api_error_1.default(400, "Unauthorized,please login first");
        }
        const { productId } = req.params;
        const product = await product_model_1.default.findById(productId);
        if (!product) {
            throw new api_error_1.default(404, "Product not found");
        }
        let usersWishList = await whistlist_model_1.default.findOne({ user: userId });
        if (!usersWishList) {
            usersWishList = await whistlist_model_1.default.create({
                user: userId,
                products: [product._id],
            });
        }
        else {
            if (usersWishList.products.includes(product._id)) {
                throw new api_error_1.default(400, "Product already in wishList");
            }
            else {
                usersWishList.products.push(product._id);
                await usersWishList.save();
            }
        }
        res
            .status(201)
            .json(new api_response_1.default("product added to wishList successfully", usersWishList));
    }
    catch (error) {
        next(error);
    }
};
exports.createWishList = createWishList;
const getwishList = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new api_error_1.default(400, "Unauthorized,please Login first");
        }
        const userWishListt = await whistlist_model_1.default.findOne({ user: userId }).populate("products");
        if (!userWishListt) {
            throw new api_error_1.default(400, "WishList is Empty");
        }
        res
            .status(200)
            .json(new api_response_1.default("WishList fetched successfully", userWishListt));
    }
    catch (error) {
        next(error);
    }
};
exports.getwishList = getwishList;
const removeWishList = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new api_error_1.default(404, "Unauthorized,please login to access");
        }
        const { productId } = req.params;
        const wishList = await whistlist_model_1.default.findOne({ user: userId });
        if (!wishList) {
            throw new api_error_1.default(400, "WishList is Empty");
        }
        const product = wishList.products.find((item) => item.toString() === productId);
        if (!product) {
            throw new api_error_1.default(404, "product not found");
        }
        wishList.products = wishList.products.filter((item) => item.toString() !== productId);
        await wishList.save();
        res
            .status(200)
            .json(new api_response_1.default("Product removed from wishList successfully", wishList));
    }
    catch (error) {
        next(error);
    }
};
exports.removeWishList = removeWishList;
const clearWishList = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new api_error_1.default(400, "Unauthorized,please login to access");
        }
        const wishList = await whistlist_model_1.default.findOne({ user: userId });
        if (!wishList) {
            throw new api_error_1.default(400, "WishList is Empty");
        }
        wishList.products = [];
        await wishList.save();
        res
            .status(200)
            .json(new api_response_1.default("WishList cleared successfully", wishList));
    }
    catch (error) {
        next(error);
    }
};
exports.clearWishList = clearWishList;
