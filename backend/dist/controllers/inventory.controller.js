"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteInventory = exports.updateInventory = exports.getInventory = exports.createInventory = void 0;
const api_error_1 = __importDefault(require("../utils/api-error"));
const productVariant_model_1 = __importDefault(require("../models/productVariant.model"));
const Inventory_model_1 = require("../models/Inventory.model");
const api_response_1 = __importDefault(require("../utils/api-response"));
const createInventory = async (req, res, next) => {
    try {
        const { varient, quantity } = req.body;
        console.log(req.body);
        if (varient === undefined || quantity === undefined) {
            throw new api_error_1.default(404, "please proceed with required values");
        }
        const varientExist = await productVariant_model_1.default.findById(varient);
        if (!varientExist) {
            throw new api_error_1.default(404, "varient is not available");
        }
        if (quantity < 0) {
            throw new api_error_1.default(400, "quantity must be greater than 0");
        }
        if (!varientExist.isActive) {
            throw new api_error_1.default(400, "you cant able to add inventory for deact");
        }
        const existingInventory = await Inventory_model_1.Inventory.findOne({ varient });
        if (existingInventory) {
            throw new api_error_1.default(400, "Inventory for this varient is already exist");
        }
        const inventory = await Inventory_model_1.Inventory.create({
            varient,
            quantity,
            reservedQuantity: 0,
            lowStockThreshold: 5,
        });
        res
            .status(201)
            .json(new api_response_1.default("Inventory created successfully", inventory));
    }
    catch (error) {
        next(error);
    }
};
exports.createInventory = createInventory;
const getInventory = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) {
            throw new api_error_1.default(404, "inventory is not available");
        }
        const inventory = await Inventory_model_1.Inventory.findOne({ varient: id });
        if (!inventory) {
            throw new api_error_1.default(404, "inventory is not available");
        }
        res
            .status(200)
            .json(new api_response_1.default("Inventory fetched successfully", inventory));
    }
    catch (error) {
        next(error);
    }
};
exports.getInventory = getInventory;
const updateInventory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { quantity, reservedQuantity, lowStockThreshold } = req.body;
        if (quantity === undefined &&
            reservedQuantity === undefined &&
            lowStockThreshold === undefined) {
            throw new api_error_1.default(400, "please provide atleas one field");
        }
        const inventory = await Inventory_model_1.Inventory.findById(id);
        if (!inventory) {
            throw new api_error_1.default(404, "Inventory doesn't exist");
        }
        if (quantity !== undefined && quantity < 0) {
            throw new api_error_1.default(400, "Quantity must be greater than 0");
        }
        if (reservedQuantity !== undefined && reservedQuantity < 0) {
            throw new api_error_1.default(400, "Reserved Quantity must be greater than 0");
        }
        if (lowStockThreshold !== undefined && lowStockThreshold < 0) {
            throw new api_error_1.default(400, "Low Stock Threshold must be greater than 0");
        }
        inventory.quantity = quantity || inventory.quantity;
        inventory.reservedQuantity = reservedQuantity || inventory.reservedQuantity;
        inventory.lowStockThreshold =
            lowStockThreshold || inventory.lowStockThreshold;
        await inventory.save();
        res
            .status(200)
            .json(new api_response_1.default("Inventory updated successfully", inventory));
    }
    catch (error) {
        next(error);
    }
};
exports.updateInventory = updateInventory;
const deleteInventory = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) {
            throw new api_error_1.default(404, "inventory is not available");
        }
        const inventory = await Inventory_model_1.Inventory.findByIdAndDelete(id);
        if (!inventory) {
            throw new api_error_1.default(404, "inventory is not available");
        }
        res
            .status(200)
            .json(new api_response_1.default("Inventory deleted successfully", inventory));
    }
    catch (error) {
        next(error);
    }
};
exports.deleteInventory = deleteInventory;
