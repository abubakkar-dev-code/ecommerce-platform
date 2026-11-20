"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expireReservations = exports.confirmStock = exports.releaseStock = exports.reserveStock = exports.stockTransaction = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Inventory_model_1 = require("../models/Inventory.model");
const stockReservation_model_1 = __importDefault(require("../models/stockReservation.model"));
const order_model_1 = __importDefault(require("../models/order.model"));
const api_error_1 = __importDefault(require("../utils/api-error"));
const stockTransaction = (work) => mongoose_1.default.connection.transaction(work, { readConcern: { level: "snapshot" }, writeConcern: { w: "majority" }, readPreference: "primary" });
exports.stockTransaction = stockTransaction;
const reserveStock = async (order, user, items, session) => {
    if (!items.length || items.length > 100 || items.some((item) => !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 1_000_000)) {
        throw new api_error_1.default(400, "Invalid reservation items");
    }
    // Stable ordering reduces transaction conflicts when carts contain the same variants.
    for (const item of [...items].sort((a, b) => String(a.varient).localeCompare(String(b.varient)))) {
        const result = await Inventory_model_1.Inventory.updateOne({ varient: item.varient,
            $expr: { $gte: [{ $subtract: ["$quantity", "$reservedQuantity"] }, item.quantity] } }, { $inc: { reservedQuantity: item.quantity, __v: 1 } }, { session });
        if (result.modifiedCount !== 1)
            throw new api_error_1.default(409, "Insufficient available stock");
    }
    const [reservation] = await stockReservation_model_1.default.create([{ order, user, items, expiresAt: new Date(Date.now() + 15 * 60 * 1000) }], { session });
    return reservation;
};
exports.reserveStock = reserveStock;
const releaseStock = async (order, reason, session, restoreConfirmed = false) => {
    const reservation = await stockReservation_model_1.default.findOne({ order }).session(session);
    if (!reservation)
        return false;
    const restore = reservation.status === "confirmed" && restoreConfirmed;
    if (reservation.status !== "active" && !restore)
        return false;
    const changed = await stockReservation_model_1.default.updateOne({ _id: reservation._id, status: reservation.status }, { $set: {
            status: restore ? "restored" : reason === "expired" ? "expired" : "released", closedAt: new Date(), releaseReason: reason,
        } }, { session });
    if (changed.modifiedCount !== 1)
        throw new api_error_1.default(409, "Reservation changed; retry");
    for (const item of reservation.items) {
        const result = await Inventory_model_1.Inventory.updateOne({ varient: item.varient, ...(restore ? {} : { reservedQuantity: { $gte: item.quantity } }) }, { $inc: restore ? { quantity: item.quantity, __v: 1 } : { reservedQuantity: -item.quantity, __v: 1 } }, { session });
        if (result.modifiedCount !== 1)
            throw new api_error_1.default(409, "Stock invariant violation; manual review required");
    }
    return true;
};
exports.releaseStock = releaseStock;
const confirmStock = async (order, session) => {
    const reservation = await stockReservation_model_1.default.findOne({ order }).session(session);
    if (!reservation)
        return "review"; // Legacy unpaid orders are never silently allocated stock.
    if (reservation.status === "confirmed")
        return "already-confirmed";
    if (reservation.status !== "active")
        return "review";
    if (reservation.expiresAt <= new Date()) {
        await (0, exports.releaseStock)(order, "expired", session);
        return "review";
    }
    const claimed = await stockReservation_model_1.default.updateOne({ _id: reservation._id, status: "active", expiresAt: { $gt: new Date() } }, { $set: { status: "confirmed", closedAt: new Date() } }, { session });
    if (claimed.modifiedCount !== 1)
        throw new api_error_1.default(409, "Reservation changed; retry");
    for (const item of reservation.items) {
        const result = await Inventory_model_1.Inventory.updateOne({ varient: item.varient, quantity: { $gte: item.quantity }, reservedQuantity: { $gte: item.quantity } }, { $inc: { quantity: -item.quantity, reservedQuantity: -item.quantity, __v: 1 } }, { session });
        if (result.modifiedCount !== 1)
            throw new api_error_1.default(409, "Stock invariant violation; manual review required");
    }
    return "confirmed";
};
exports.confirmStock = confirmStock;
const expireReservations = async () => {
    const reservations = await stockReservation_model_1.default.find({ status: "active", expiresAt: { $lte: new Date() } }).select("order").limit(50).lean();
    for (const reservation of reservations) {
        await (0, exports.stockTransaction)(async (session) => {
            const current = await stockReservation_model_1.default.findOne({ order: reservation.order, status: "active", expiresAt: { $lte: new Date() } }).session(session);
            if (!current)
                return;
            await (0, exports.releaseStock)(reservation.order, "expired", session);
            await order_model_1.default.updateOne({ _id: reservation.order, paymentStatus: { $ne: "paid" }, orderStatus: "pending" }, { $set: { orderStatus: "expired" } }, { session });
        });
    }
};
exports.expireReservations = expireReservations;
