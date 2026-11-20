"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteInventory = exports.updateInventory = exports.getAdminInventory = exports.getInventory = exports.createInventory = void 0;
const zod_1 = require("zod");
const productVariant_model_1 = __importDefault(require("../models/productVariant.model"));
const Inventory_model_1 = require("../models/Inventory.model");
const inventoryAdjustment_model_1 = __importDefault(require("../models/inventoryAdjustment.model"));
const stockReservation_model_1 = __importDefault(require("../models/stockReservation.model"));
const api_error_1 = __importDefault(require("../utils/api-error"));
const api_response_1 = __importDefault(require("../utils/api-response"));
const catalog_validation_1 = require("../validation/catalog.validation");
const inventory_service_1 = require("../services/inventory.service");
const count = zod_1.z.number().int().min(0).max(1_000_000_000);
const createSchema = zod_1.z.object({ varient: catalog_validation_1.objectId, quantity: count }).strict();
const updateSchema = zod_1.z
    .object({
    quantity: count.optional(),
    lowStockThreshold: count.optional(),
    reason: zod_1.z.string().trim().min(1).max(300).optional(),
})
    .strict()
    .refine((value) => value.quantity !== undefined || value.lowStockThreshold !== undefined);
const createInventory = async (req, res, next) => {
    try {
        const body = (0, catalog_validation_1.parse)(createSchema, req.body);
        const variant = await productVariant_model_1.default.findById(body.varient);
        if (!variant || !variant.isActive)
            throw new api_error_1.default(404, "Variant is unavailable");
        const inventory = await Inventory_model_1.Inventory.create({
            ...body,
            reservedQuantity: 0,
            lowStockThreshold: 5,
        });
        res
            .status(201)
            .json(new api_response_1.default("Inventory created successfully", inventory));
    }
    catch (error) {
        next((0, catalog_validation_1.catalogError)(error));
    }
};
exports.createInventory = createInventory;
const getInventory = async (req, res, next) => {
    try {
        const id = (0, catalog_validation_1.parse)(catalog_validation_1.objectId, req.params.id);
        const inventory = await Inventory_model_1.Inventory.findOne({ varient: id });
        if (!inventory)
            throw new api_error_1.default(404, "inventory is not available");
        res.status(200).json(new api_response_1.default("Inventory fetched successfully", {
            varient: inventory.varient,
            inStock: inventory.quantity > inventory.reservedQuantity,
        }));
    }
    catch (error) {
        next((0, catalog_validation_1.catalogError)(error));
    }
};
exports.getInventory = getInventory;
const getAdminInventory = async (req, res, next) => {
    try {
        const inventory = await Inventory_model_1.Inventory.findById((0, catalog_validation_1.parse)(catalog_validation_1.objectId, req.params.id));
        if (!inventory)
            throw new api_error_1.default(404, "Inventory not found");
        res
            .status(200)
            .json(new api_response_1.default("Inventory details fetched successfully", inventory));
    }
    catch (error) {
        next((0, catalog_validation_1.catalogError)(error));
    }
};
exports.getAdminInventory = getAdminInventory;
const updateInventory = async (req, res, next) => {
    try {
        const id = (0, catalog_validation_1.parse)(catalog_validation_1.objectId, req.params.id);
        const body = (0, catalog_validation_1.parse)(updateSchema, req.body);
        const inventory = await (0, inventory_service_1.stockTransaction)(async (session) => {
            const current = await Inventory_model_1.Inventory.findById(id).session(session);
            if (!current)
                throw new api_error_1.default(404, "Inventory doesn't exist");
            const quantity = body.quantity ?? current.quantity;
            if (quantity < current.reservedQuantity)
                throw new api_error_1.default(409, "Stock cannot be lower than reserved quantity");
            const updated = await Inventory_model_1.Inventory.findOneAndUpdate({
                _id: id,
                quantity: current.quantity,
                reservedQuantity: current.reservedQuantity,
            }, {
                $set: {
                    quantity,
                    lowStockThreshold: body.lowStockThreshold ?? current.lowStockThreshold,
                },
                $inc: { __v: 1 },
            }, { session, returnDocument: "after", runValidators: true });
            if (!updated)
                throw new api_error_1.default(409, "Inventory changed; reload and retry");
            await inventoryAdjustment_model_1.default.create([
                {
                    inventory: id,
                    actor: req.user.userId,
                    previousQuantity: current.quantity,
                    quantity,
                    reason: body.reason ?? "Administrative inventory update",
                },
            ], { session });
            return updated;
        });
        res
            .status(200)
            .json(new api_response_1.default("Inventory updated successfully", inventory));
    }
    catch (error) {
        next((0, catalog_validation_1.catalogError)(error));
    }
};
exports.updateInventory = updateInventory;
const deleteInventory = async (req, res, next) => {
    try {
        const id = (0, catalog_validation_1.parse)(catalog_validation_1.objectId, req.params.id);
        const inventory = await (0, inventory_service_1.stockTransaction)(async (session) => {
            const current = await Inventory_model_1.Inventory.findById(id).session(session);
            if (!current || current.quantity !== 0 || current.reservedQuantity !== 0)
                throw new api_error_1.default(409, "Only empty, unreserved inventory can be deleted");
            if (await stockReservation_model_1.default.exists({
                "items.varient": current.varient,
                status: { $in: ["active", "confirmed"] },
            }).session(session)) {
                throw new api_error_1.default(409, "Inventory still supports a reservation or restorable order");
            }
            return Inventory_model_1.Inventory.findOneAndDelete({
                _id: id,
                quantity: 0,
                reservedQuantity: 0,
            }).session(session);
        });
        res
            .status(200)
            .json(new api_response_1.default("Inventory deleted successfully", inventory));
    }
    catch (error) {
        next((0, catalog_validation_1.catalogError)(error));
    }
};
exports.deleteInventory = deleteInventory;
