import { NextFunction, Request, Response } from "express";
import ApiError from "../utils/api-error";
import Varient from "../models/productVariant.model";
import { Inventory } from "../models/Inventory.model";
import ApiResponse from "../utils/api-response";

export const createInventory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { varient, quantity } = req.body;
    console.log(req.body);
    if (varient === undefined || quantity === undefined) {
      throw new ApiError(404, "please proceed with required values");
    }
    const varientExist = await Varient.findById(varient);
    if (!varientExist) {
      throw new ApiError(404, "varient is not available");
    }
    if (quantity < 0) {
      throw new ApiError(400, "quantity must be greater than 0");
    }
    if (!varientExist.isActive) {
      throw new ApiError(400, "you cant able to add inventory for deact");
    }
    const existingInventory = await Inventory.findOne({ varient });
    if (existingInventory) {
      throw new ApiError(400, "Inventory for this varient is already exist");
    }
    const inventory = await Inventory.create({
      varient,
      quantity,
      reservedQuantity: 0,
      lowStockThreshold: 5,
    });
    res
      .status(201)
      .json(new ApiResponse("Inventory created successfully", inventory));
  } catch (error) {
    next(error);
  }
};
export const getInventory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    if (!id) {
      throw new ApiError(404, "inventory is not available");
    }
    const inventory = await Inventory.findOne({ varient: id });
    if (!inventory) {
      throw new ApiError(404, "inventory is not available");
    }
    res
      .status(200)
      .json(new ApiResponse("Inventory fetched successfully", inventory));
  } catch (error) {
    next(error);
  }
};
export const updateInventory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { quantity, reservedQuantity, lowStockThreshold } = req.body;
    if (
      quantity === undefined &&
      reservedQuantity === undefined &&
      lowStockThreshold === undefined
    ) {
      throw new ApiError(400, "please provide atleas one field");
    }
    const inventory = await Inventory.findById(id);
    if (!inventory) {
      throw new ApiError(404, "Inventory doesn't exist");
    }
    if (quantity !== undefined && quantity < 0) {
      throw new ApiError(400, "Quantity must be greater than 0");
    }
    if (reservedQuantity !== undefined && reservedQuantity < 0) {
      throw new ApiError(400, "Reserved Quantity must be greater than 0");
    }
    if (lowStockThreshold !== undefined && lowStockThreshold < 0) {
      throw new ApiError(400, "Low Stock Threshold must be greater than 0");
    }
    inventory.quantity = quantity || inventory.quantity;
    inventory.reservedQuantity = reservedQuantity || inventory.reservedQuantity;
    inventory.lowStockThreshold =
      lowStockThreshold || inventory.lowStockThreshold;
    await inventory.save();
    res
      .status(200)
      .json(new ApiResponse("Inventory updated successfully", inventory));
  } catch (error) {
    next(error);
  }
};
export const deleteInventory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    if (!id) {
      throw new ApiError(404, "inventory is not available");
    }
    const inventory = await Inventory.findByIdAndDelete(id);
    if (!inventory) {
      throw new ApiError(404, "inventory is not available");
    }
    res
      .status(200)
      .json(new ApiResponse("Inventory deleted successfully", inventory));
  } catch (error) {
    next(error);
  }
};
