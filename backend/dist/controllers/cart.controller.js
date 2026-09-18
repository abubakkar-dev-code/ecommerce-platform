"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCart = exports.removeCart = exports.updateCart = exports.getCart = exports.createCart = void 0;
const api_error_1 = __importDefault(require("../utils/api-error"));
const product_model_1 = __importDefault(require("../models/product.model"));
const productVariant_model_1 = __importDefault(require("../models/productVariant.model"));
const Inventory_model_1 = require("../models/Inventory.model");
const cart_model_1 = __importDefault(require("../models/cart.model"));
const api_response_1 = __importDefault(require("../utils/api-response"));
const createCart = async (req, res, next) => {
    try {
        const { productId, varientId } = req.params;
        const { quantity } = req.body;
        const userId = req.user?.userId;
        if (!userId) {
            throw new api_error_1.default(401, "Please login to add items to cart");
        }
        if (!productId || !varientId) {
            throw new api_error_1.default(400, "productId and varientId are missing");
        }
        if (!quantity || quantity < 1) {
            throw new api_error_1.default(400, "Quantity must be at least 1");
        }
        const product = await product_model_1.default.findById(productId);
        if (!product) {
            throw new api_error_1.default(404, "Product not found");
        }
        const varient = await productVariant_model_1.default.findById(varientId);
        if (!varient) {
            throw new api_error_1.default(404, "Varient not found");
        }
        if (varient.product.toString() !== productId) {
            throw new api_error_1.default(400, "Varient doesn't belong to this product");
        }
        const inventoryDetails = await Inventory_model_1.Inventory.findOne({
            varient: varientId,
        });
        if (!inventoryDetails) {
            throw new api_error_1.default(404, "Inventory details not found");
        }
        if (inventoryDetails.quantity < quantity) {
            throw new api_error_1.default(400, `Only ${inventoryDetails.quantity} items are available`);
        }
        const productPrice = varient.price;
        const orderedItems = {
            product: productId,
            varient: varientId,
            quantity,
            price: productPrice,
        };
        let cart = await cart_model_1.default.findOne({ user: userId });
        if (!cart) {
            cart = await cart_model_1.default.create({
                user: userId,
                items: [orderedItems],
            });
            res.status(201).json(new api_response_1.default("Added to cart successfully", cart));
            return;
        }
        const existingItem = cart.items.find((item) => item.varient.toString() === varientId);
        if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;
            if (newQuantity > inventoryDetails.quantity) {
                throw new api_error_1.default(400, `Only ${inventoryDetails.quantity} items are available`);
            }
            existingItem.quantity = newQuantity;
        }
        else {
            cart.items.push(orderedItems);
        }
        await cart.save();
        res.status(201).json(new api_response_1.default("Added to cart successfully", cart));
    }
    catch (error) {
        next(error);
    }
};
exports.createCart = createCart;
const getCart = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new api_error_1.default(400, "please login to see your cart");
        }
        const cart = await cart_model_1.default.findOne({ user: userId })
            .populate("items.product")
            .populate("items.varient");
        if (!cart) {
            throw new api_error_1.default(400, "Cart is Empty,keep shopping");
        }
        const cartItems = cart.items.map((item) => {
            const itemTotal = item.price * item.quantity;
            return {
                ...item.toObject(),
                itemTotal,
            };
        });
        const totalAmount = cartItems.reduce((total, item) => total + item.itemTotal, 0);
        res.status(200).json(new api_response_1.default("Cart fetched successfully", {
            cartItems,
            totalAmount,
        }));
    }
    catch (error) {
        next(error);
    }
};
exports.getCart = getCart;
const updateCart = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new api_error_1.default(401, "Please login to update your cart");
        }
        const { varientId } = req.params;
        const { quantity } = req.body;
        if (quantity < 1) {
            throw new api_error_1.default(400, "quantity must be at least 1");
        }
        const cart = await cart_model_1.default.findOne({ user: userId });
        if (!cart) {
            throw new api_error_1.default(400, "Cart is Empty");
        }
        const requiredItem = cart.items.find((item) => item.varient.toString() === varientId);
        if (!requiredItem) {
            throw new api_error_1.default(404, "Item not found");
        }
        const inventory = await Inventory_model_1.Inventory.findOne({ varient: varientId });
        if (!inventory) {
            throw new api_error_1.default(404, "Inventory not found");
        }
        if (inventory.quantity < quantity) {
            throw new api_error_1.default(400, `Stocks are limited,we have only ${inventory.quantity} items left`);
        }
        requiredItem.quantity = quantity;
        await cart.save();
        res.status(200).json(new api_response_1.default("Cart updated successfully", cart));
    }
    catch (error) {
        next(error);
    }
};
exports.updateCart = updateCart;
const removeCart = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new api_error_1.default(404, "unauthorized,please login");
        }
        const { varientId } = req.params;
        const cart = await cart_model_1.default.findOne({ user: userId });
        if (!cart) {
            throw new api_error_1.default(400, "cart is empty");
        }
        const existingVarient = cart.items.find((item) => item.varient.toString() === varientId);
        if (!existingVarient) {
            throw new api_error_1.default(404, "item not found in cart");
        }
        cart.items.pull({ varient: varientId });
        await cart?.save();
        res.status(200).json(new api_response_1.default("Item removed from cart", cart));
    }
    catch (error) {
        next(error);
    }
};
exports.removeCart = removeCart;
const clearCart = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new api_error_1.default(400, "unauthorized,please login");
        }
        const cart = await cart_model_1.default.findOne({ user: userId });
        if (!cart) {
            throw new api_error_1.default(400, "cart is empty");
        }
        cart.items.splice(0, cart.items.length);
        await cart.save();
        res.status(200).json(new api_response_1.default("Cart cleared successfully", cart));
    }
    catch (error) {
        next(error);
    }
};
exports.clearCart = clearCart;
