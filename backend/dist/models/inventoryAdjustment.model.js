"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    inventory: { type: mongoose_1.Schema.Types.ObjectId, ref: "Inventory", required: true },
    actor: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    previousQuantity: { type: Number, required: true },
    quantity: { type: Number, required: true },
    reason: { type: String, required: true, maxLength: 300 },
}, { timestamps: true });
schema.index({ inventory: 1, createdAt: -1 });
exports.default = (0, mongoose_1.model)("InventoryAdjustment", schema);
