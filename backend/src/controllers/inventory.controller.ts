import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import Varient from "../models/productVariant.model";
import { Inventory } from "../models/Inventory.model";
import Adjustment from "../models/inventoryAdjustment.model";
import Reservation from "../models/stockReservation.model";
import ApiError from "../utils/api-error";
import ApiResponse from "../utils/api-response";
import {
  catalogError,
  objectId,
  parse,
} from "../validation/catalog.validation";
import { stockTransaction } from "../services/inventory.service";

const count = z.number().int().min(0).max(1_000_000_000);
const createSchema = z.object({
  varient: objectId,
  quantity: count,
  lowStockThreshold: count.default(5),
}).strict();
const updateSchema = z
  .object({
    quantity: count.optional(),
    lowStockThreshold: count.optional(),
    reason: z.string().trim().min(1).max(300).optional(),
  })
  .strict()
  .refine(
    (value) =>
      value.quantity !== undefined || value.lowStockThreshold !== undefined,
  );

export const createInventory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = createSchema.safeParse(req.body);
    if (!result.success) {
      const issues = result.error.issues;
      if (issues.some((issue) => issue.code === "unrecognized_keys")) {
        throw new ApiError(400, 'Send only "varient", "quantity", and optional "lowStockThreshold" as JSON');
      }
      if (issues.some((issue) => issue.path[0] === "varient")) {
        throw new ApiError(400, '"varient" must be the variant’s 24-character MongoDB ID');
      }
      if (issues.some((issue) => issue.path[0] === "quantity")) {
        throw new ApiError(400, '"quantity" must be a JSON integer between 0 and 1000000000');
      }
      if (issues.some((issue) => issue.path[0] === "lowStockThreshold")) {
        throw new ApiError(400, '"lowStockThreshold" must be a JSON integer between 0 and 1000000000');
      }
      throw new ApiError(400, 'Send a JSON object with "varient" and "quantity"');
    }
    const body = result.data;
    const variant = await Varient.findById(body.varient);
    if (!variant || !variant.isActive)
      throw new ApiError(404, "Variant is unavailable");
    const inventory = await Inventory.create({
      ...body,
      reservedQuantity: 0,
    });
    res
      .status(201)
      .json(new ApiResponse("Inventory created successfully", inventory));
  } catch (error) {
    next(catalogError(error));
  }
};
export const getInventory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parse(objectId, req.params.id);
    const rawQuantity = req.query.quantity;
    const quantity = rawQuantity === undefined ? 1 : Number(rawQuantity);
    if (rawQuantity !== undefined && (typeof rawQuantity !== "string" || !/^[1-9]\d*$/.test(rawQuantity) || !Number.isSafeInteger(quantity))) {
      throw new ApiError(400, "Invalid stock quantity");
    }
    const inventory = await Inventory.findOne({ varient: id });
    if (!inventory) throw new ApiError(404, "inventory is not available");
    res.status(200).json(
      new ApiResponse("Inventory fetched successfully", {
        varient: inventory.varient,
        inStock: inventory.quantity - (inventory.reservedQuantity ?? 0) >= quantity,
      }),
    );
  } catch (error) {
    next(catalogError(error));
  }
};
export const getAdminInventory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const inventory = await Inventory.findById(parse(objectId, req.params.id));
    if (!inventory) throw new ApiError(404, "Inventory not found");
    res
      .status(200)
      .json(
        new ApiResponse("Inventory details fetched successfully", inventory),
      );
  } catch (error) {
    next(catalogError(error));
  }
};
export const updateInventory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parse(objectId, req.params.id);
    const body = parse(updateSchema, req.body);
    const inventory = await stockTransaction(async (session) => {
      const current = await Inventory.findById(id).session(session);
      if (!current) throw new ApiError(404, "Inventory doesn't exist");
      const quantity = body.quantity ?? current.quantity;
      if (quantity < current.reservedQuantity)
        throw new ApiError(409, "Stock cannot be lower than reserved quantity");
      const updated = await Inventory.findOneAndUpdate(
        {
          _id: id,
          quantity: current.quantity,
          reservedQuantity: current.reservedQuantity,
        },
        {
          $set: {
            quantity,
            lowStockThreshold:
              body.lowStockThreshold ?? current.lowStockThreshold,
          },
          $inc: { __v: 1 },
        },
        { session, returnDocument: "after", runValidators: true },
      );
      if (!updated)
        throw new ApiError(409, "Inventory changed; reload and retry");
      await Adjustment.create(
        [
          {
            inventory: id,
            actor: req.user!.userId,
            previousQuantity: current.quantity,
            quantity,
            reason: body.reason ?? "Administrative inventory update",
          },
        ],
        { session },
      );
      return updated;
    });
    res
      .status(200)
      .json(new ApiResponse("Inventory updated successfully", inventory));
  } catch (error) {
    next(catalogError(error));
  }
};
export const deleteInventory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parse(objectId, req.params.id);
    const inventory = await stockTransaction(async (session) => {
      const current = await Inventory.findById(id).session(session);
      if (!current || current.quantity !== 0 || current.reservedQuantity !== 0)
        throw new ApiError(
          409,
          "Only empty, unreserved inventory can be deleted",
        );
      if (
        await Reservation.exists({
          "items.varient": current.varient,
          status: { $in: ["active", "confirmed"] },
        }).session(session)
      ) {
        throw new ApiError(
          409,
          "Inventory still supports a reservation or restorable order",
        );
      }
      return Inventory.findOneAndDelete({
        _id: id,
        quantity: 0,
        reservedQuantity: 0,
      }).session(session);
    });
    res
      .status(200)
      .json(new ApiResponse("Inventory deleted successfully", inventory));
  } catch (error) {
    next(catalogError(error));
  }
};
