"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeAddress = exports.updateAddress = exports.getAddress = exports.createOrUpdateAddress = void 0;
const api_error_1 = __importDefault(require("../utils/api-error"));
const address_model_1 = __importDefault(require("../models/address.model"));
const api_response_1 = __importDefault(require("../utils/api-response"));
const createOrUpdateAddress = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new api_error_1.default(401, "Unauthorized, please login");
        }
        const { fullName, phone, addressLine1, city, state, pincode, country, isDefault, } = req.body;
        if (!fullName ||
            !phone ||
            !addressLine1 ||
            !city ||
            !state ||
            !pincode ||
            !country) {
            throw new api_error_1.default(400, "All fields are required");
        }
        const existingAddress = await address_model_1.default.findOne({ user: userId });
        if (!existingAddress) {
            const address = await address_model_1.default.create({
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
                .json(new api_response_1.default("Address added successfully", address));
            return;
        }
        if (isDefault === true) {
            await address_model_1.default.updateMany({ user: userId, isDefault: true }, { $set: { isDefault: false } });
        }
        const address = await address_model_1.default.create({
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
            .json(new api_response_1.default("Address added successfully", address));
    }
    catch (error) {
        next(error);
    }
};
exports.createOrUpdateAddress = createOrUpdateAddress;
const getAddress = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new api_error_1.default(400, "Unauthorized,please login to acccess");
        }
        const addresses = await address_model_1.default.find({ user: userId });
        if (addresses.length === 0) {
            throw new api_error_1.default(404, "Thers no address found,create new Address");
        }
        res
            .status(200)
            .json(new api_response_1.default("Address details fetched successfully", addresses));
    }
    catch (error) {
        next(error);
    }
};
exports.getAddress = getAddress;
const updateAddress = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new api_error_1.default(401, "Unauthorized, please login to access");
        }
        const { addressId } = req.params;
        const { fullName, phone, addressLine1, addressLine2, city, state, pincode, country, isDefault, } = req.body;
        const address = await address_model_1.default.findOne({
            _id: addressId,
            user: userId,
        });
        if (!address) {
            throw new api_error_1.default(404, "Address not found");
        }
        if (isDefault === true) {
            await address_model_1.default.updateMany({
                user: userId,
                isDefault: true,
            }, {
                $set: { isDefault: false },
            });
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
            .json(new api_response_1.default("Address updated successfully", address));
    }
    catch (error) {
        next(error);
    }
};
exports.updateAddress = updateAddress;
const removeAddress = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { addressId } = req.params;
        if (!userId) {
            throw new api_error_1.default(401, "Unauthorized, please login to access");
        }
        const address = await address_model_1.default.findOne({
            user: userId,
            _id: addressId,
        });
        if (!address) {
            throw new api_error_1.default(404, "Address not found");
        }
        const wasDefault = address.isDefault;
        await address_model_1.default.findByIdAndDelete(addressId);
        if (wasDefault === true) {
            const anotherAddress = await address_model_1.default.findOne({
                user: userId,
            });
            if (anotherAddress) {
                anotherAddress.isDefault = true;
                await anotherAddress.save();
            }
        }
        res
            .status(200)
            .json(new api_response_1.default("Address removed successfully", address));
    }
    catch (error) {
        next(error);
    }
};
exports.removeAddress = removeAddress;
