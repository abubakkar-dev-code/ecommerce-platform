import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import Address from "../models/address.model";
import ApiError from "../utils/api-error";
import ApiResponse from "../utils/api-response";
import { objectId, parse } from "../validation/catalog.validation";
import { stockTransaction } from "../services/inventory.service";

const field = (limit: number) => z.string().trim().min(1).max(limit);
const addressInput = z.object({
  fullName: field(120),
  phone: field(32).refine((value) => /^[+\d() .-]+$/.test(value) && /^\d{7,15}$/.test(value.replace(/\D/g, ""))),
  addressLine1: field(250),
  addressLine2: z.string().trim().max(250).optional(),
  city: field(100),
  state: field(100),
  pincode: field(32),
  country: field(100),
  isDefault: z.boolean().optional(),
}).strict();

function validated<T>(schema: z.ZodType<T>, input: unknown) {
  const result = schema.safeParse(input);
  if (!result.success) throw new ApiError(400, "Check the shipping address fields and phone number");
  return result.data;
}

function writeError(error: unknown) {
  return error && typeof error === "object" && "code" in error && error.code === 11000
    ? new ApiError(409, "Default address changed. Reload and retry.") : error;
}

export const createOrUpdateAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!.userId!;
    const body = validated(addressInput, req.body);
    const address = await stockTransaction(async (session) => {
      const isDefault = body.isDefault === true || !(await Address.exists({ user, isDefault: true }).session(session));
      if (isDefault) await Address.updateMany({ user, isDefault: true }, { $set: { isDefault: false } }, { session });
      const [created] = await Address.create([{ ...body, user, isDefault }], { session });
      return created;
    });
    res.status(201).json(new ApiResponse("Address added successfully", address));
  } catch (error) { next(writeError(error)); }
};

export const getAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const addresses = await Address.find({ user: req.user!.userId! }).sort({ isDefault: -1, _id: -1 }).lean();
    if (!addresses.length) throw new ApiError(404, "No addresses found");
    res.json(new ApiResponse("Addresses", addresses));
  } catch (error) { next(error); }
};

export const updateAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!.userId!;
    const id = parse(objectId, req.params.addressId);
    const { isDefault, ...fields } = validated(addressInput.partial(), req.body);
    const result = await stockTransaction(async (session) => {
      const address = await Address.findOne({ _id: id, user }).session(session);
      if (!address) throw new ApiError(404, "Address not found");
      if (isDefault === true) {
        await Address.updateMany({ user, _id: { $ne: id }, isDefault: true }, { $set: { isDefault: false } }, { session });
        address.isDefault = true;
      } else if (isDefault === false && address.isDefault) {
        const alternate = await Address.findOne({ user, _id: { $ne: id } }).sort({ _id: 1 }).session(session);
        if (alternate) {
          address.isDefault = false;
          await address.save({ session });
          alternate.isDefault = true;
          await alternate.save({ session });
        }
      }
      Object.assign(address, fields);
      return address.save({ session });
    });
    res.json(new ApiResponse("Address updated successfully", result));
  } catch (error) { next(writeError(error)); }
};

export const removeAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!.userId!;
    const id = parse(objectId, req.params.addressId);
    const result = await stockTransaction(async (session) => {
      const address = await Address.findOneAndDelete({ _id: id, user }).session(session);
      if (!address) throw new ApiError(404, "Address not found");
      if (address.isDefault) {
        const alternate = await Address.findOne({ user }).sort({ _id: 1 }).session(session);
        if (alternate) {
          alternate.isDefault = true;
          await alternate.save({ session });
        }
      }
      return address;
    });
    res.json(new ApiResponse("Address removed successfully", result));
  } catch (error) { next(writeError(error)); }
};
