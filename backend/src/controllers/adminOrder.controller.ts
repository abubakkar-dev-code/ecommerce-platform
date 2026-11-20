import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import Order from "../models/order.model";
import ApiError from "../utils/api-error";
import ApiResponse from "../utils/api-response";
import { objectId, pageQuery, parse } from "../validation/catalog.validation";

const fulfillment = { processing: "confirmed", shipped: "processing", delivered: "shipped" } as const;
const transition = z.object({ status: z.enum(["processing", "shipped", "delivered"]), cashReceived: z.literal(true).optional() }).strict();
const statuses = z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "expired", "payment_review"]);
const orderQuery = pageQuery.extend({ status: statuses.optional(), orderId: objectId.optional() });

export async function listAdminOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, status, orderId } = parse(orderQuery, req.query);
    const filter = { ...(status ? { orderStatus: status } : {}), ...(orderId ? { _id: orderId } : {}) };
    const [orders, total] = await Promise.all([
      Order.find(filter).select("createdAt subtotal shippingCharge totalAmount orderStatus paymentStatus paymentMethod")
        .sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Order.countDocuments(filter),
    ]);
    res.setHeader("Cache-Control", "no-store");
    res.json(new ApiResponse("Orders", orders, { page, limit, total, totalPages: Math.ceil(total / limit) }));
  } catch (error) { next(error); }
}

export async function getAdminOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parse(objectId, req.params.orderId);
    const order = await Order.findById(id).populate("items.product", "name").populate("items.varient", "sku").lean();
    if (!order) throw new ApiError(404, "Order not found");
    res.setHeader("Cache-Control", "no-store");
    res.json(new ApiResponse("Order", order));
  } catch (error) { next(error); }
}

export async function updateFulfillment(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parse(objectId, req.params.orderId);
    const { status, cashReceived } = parse(transition, req.body);
    if (cashReceived && status !== "delivered") throw new ApiError(400, "Record cash when confirming delivery");
    const paymentFilter = cashReceived ? { paymentMethod: "cod" as const, paymentStatus: "pending" }
      : status === "delivered" ? { paymentStatus: "paid" }
      : { $or: [{ paymentStatus: "paid" }, { paymentMethod: "cod" as const, paymentStatus: "pending" }] };
    const result = await Order.updateOne({ _id: id, orderStatus: fulfillment[status], ...paymentFilter },
      { $set: { orderStatus: status, ...(cashReceived ? { paymentStatus: "paid" } : {}) } }, { runValidators: true });
    if (result.matchedCount !== 1) throw new ApiError(409, "Order no longer qualifies for this transition");
    res.json(new ApiResponse("Fulfillment status updated", { orderStatus: status }));
  } catch (error) { next(error); }
}
