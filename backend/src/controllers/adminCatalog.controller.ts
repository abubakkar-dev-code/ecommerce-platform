import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import Product from "../models/product.model";
import Order from "../models/order.model";
import { Inventory } from "../models/Inventory.model";
import ApiResponse from "../utils/api-response";
import { objectId, pageQuery, parse } from "../validation/catalog.validation";

const lowStock = { $expr: { $lte: [
  { $subtract: ["$quantity", { $ifNull: ["$reservedQuantity", 0] }] },
  { $ifNull: ["$lowStockThreshold", 5] },
] } };
const inventoryQuery = pageQuery.extend({ varient: objectId.optional(), lowStock: z.literal("true").optional() });

export async function getDashboard(_req: Request, res: Response, next: NextFunction) {
  try {
    const qualifying = { paymentStatus: "paid", orderStatus: { $in: ["confirmed", "processing", "shipped", "delivered"] } };
    const [products, activeProducts, orders, pendingOrders, lowStockVariants, totals] = await Promise.all([
      Product.countDocuments(), Product.countDocuments({ isActive: true }),
      Order.countDocuments(), Order.countDocuments({ orderStatus: "pending" }), Inventory.countDocuments(lowStock),
      Order.aggregate<{ amount: number }>([
        { $match: qualifying },
        { $group: { _id: null, paise: { $sum: { $round: [{ $multiply: ["$totalAmount", 100] }, 0] } } } },
        { $project: { amount: { $divide: ["$paise", 100] } } },
      ]).option({ maxTimeMS: 5000 }),
    ]);
    res.setHeader("Cache-Control", "no-store");
    res.json(new ApiResponse("Dashboard", { products, activeProducts, orders, pendingOrders, lowStockVariants, paidOrderTotal: totals[0]?.amount ?? 0 }));
  } catch (error) { next(error); }
}

export async function listInventory(req: Request, res: Response, next: NextFunction) {
  try {
    const query = parse(inventoryQuery, req.query);
    const filter = { ...(query.varient ? { varient: query.varient } : {}), ...(query.lowStock ? lowStock : {}) };
    const [items, total] = await Promise.all([
      Inventory.find(filter).select("varient quantity reservedQuantity lowStockThreshold")
        .sort({ _id: -1 }).skip((query.page - 1) * query.limit).limit(query.limit)
        .populate("varient", "sku").lean(),
      Inventory.countDocuments(filter),
    ]);
    res.setHeader("Cache-Control", "no-store");
    res.json(new ApiResponse("Inventory records", items, { totalPages: Math.ceil(total / query.limit), total }));
  } catch (error) { next(error); }
}
