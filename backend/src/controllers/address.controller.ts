import { NextFunction, Request, Response } from "express";
import ApiError from "../utils/api-error";
import Address from "../models/address.model";
import ApiResponse from "../utils/api-response";

export const createOrUpdateAddress = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(401, "Unauthorized, please login");
    }

    const {
      fullName,
      phone,
      addressLine1,
      city,
      state,
      pincode,
      country,
      isDefault,
    } = req.body;

    if (
      !fullName ||
      !phone ||
      !addressLine1 ||
      !city ||
      !state ||
      !pincode ||
      !country
    ) {
      throw new ApiError(400, "All fields are required");
    }

    const existingAddress = await Address.findOne({ user: userId });
    if (!existingAddress) {
      const address = await Address.create({
        user: userId,
        fullName,
        phone,
        addressLine1,
        city,
        state,
        pincode,
        country,
        isDefault: true,
      });

      res
        .status(201)
        .json(new ApiResponse("Address added successfully", address));

      return;
    }
    if (isDefault === true) {
      await Address.updateMany(
        { user: userId, isDefault: true },
        { $set: { isDefault: false } },
      );
    }

    const address = await Address.create({
      user: userId,
      fullName,
      phone,
      addressLine1,
      city,
      state,
      pincode,
      country,
      isDefault: isDefault ?? false,
    });

    res
      .status(201)
      .json(new ApiResponse("Address added successfully", address));
  } catch (error) {
    next(error);
  }
};
export const getAddress = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError(400, "Unauthorized,please login to acccess");
    }
    const addresses = await Address.find({ user: userId });
    if (addresses.length === 0) {
      throw new ApiError(404, "Thers no address found,create new Address");
    }
    res
      .status(200)
      .json(new ApiResponse("Address details fetched successfully", addresses));
  } catch (error) {
    next(error);
  }
};
export const updateAddress = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(401, "Unauthorized, please login to access");
    }

    const { addressId } = req.params;

    const {
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      country,
      isDefault,
    } = req.body;
    const address = await Address.findOne({
      _id: addressId,
      user: userId,
    });

    if (!address) {
      throw new ApiError(404, "Address not found");
    }
    if (isDefault === true) {
      await Address.updateMany(
        {
          user: userId,
          isDefault: true,
        },
        {
          $set: { isDefault: false },
        },
      );
    }
    address.fullName = fullName ?? address.fullName;
    address.phone = phone ?? address.phone;
    address.addressLine1 = addressLine1 ?? address.addressLine1;
    address.addressLine2 = addressLine2 ?? address.addressLine2;
    address.city = city ?? address.city;
    address.state = state ?? address.state;
    address.pincode = pincode ?? address.pincode;
    address.country = country ?? address.country;
    address.isDefault = isDefault ?? address.isDefault;
    await address.save();
    res
      .status(200)
      .json(new ApiResponse("Address updated successfully", address));
  } catch (error) {
    next(error);
  }
};
export const removeAddress = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;
    const { addressId } = req.params;

    if (!userId) {
      throw new ApiError(401, "Unauthorized, please login to access");
    }

    const address = await Address.findOne({
      user: userId,
      _id: addressId,
    });

    if (!address) {
      throw new ApiError(404, "Address not found");
    }

    const wasDefault = address.isDefault;

    await Address.findByIdAndDelete(addressId);

    if (wasDefault === true) {
      const anotherAddress = await Address.findOne({
        user: userId,
      });

      if (anotherAddress) {
        anotherAddress.isDefault = true;
        await anotherAddress.save();
      }
    }
    res
      .status(200)
      .json(new ApiResponse("Address removed successfully", address));
  } catch (error) {
    next(error);
  }
};
