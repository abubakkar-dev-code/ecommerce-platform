"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBrand = exports.updateBrand = exports.getBrandById = exports.getBrands = exports.createBrand = void 0;
const api_error_1 = __importDefault(require("../utils/api-error"));
const brand_model_1 = __importDefault(require("../models/brand.model"));
const api_response_1 = __importDefault(require("../utils/api-response"));
const createBrand = async (req, res, next) => {
    try {
        const { name, slug, description, logo } = req.body;
        console.log(req.body);
        if (!name || !slug) {
            throw new api_error_1.default(400, "name and slug are required");
        }
        const existingBrand = await brand_model_1.default.findOne({ slug });
        if (existingBrand) {
            throw new api_error_1.default(409, "A brans same name already exist");
        }
        const brand = await brand_model_1.default.create({
            name,
            slug,
            description,
            logo,
        });
        res.status(201).json(new api_response_1.default("Brand created successfully", brand));
    }
    catch (error) {
        next(error);
    }
};
exports.createBrand = createBrand;
const getBrands = async (_req, res, next) => {
    try {
        const brands = await brand_model_1.default.find();
        if (!brands) {
            throw new api_error_1.default(404, "No brands found for this category");
        }
        res
            .status(200)
            .json(new api_response_1.default("Brands details fetched successfully", brands));
    }
    catch (error) {
        next(error);
    }
};
exports.getBrands = getBrands;
const getBrandById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const brand = await brand_model_1.default.findById(id);
        if (!brand) {
            throw new api_error_1.default(404, "Brand not found");
        }
        res.status(200).json(new api_response_1.default("Brand fetched successfully", brand));
    }
    catch (error) {
        next(error);
    }
};
exports.getBrandById = getBrandById;
const updateBrand = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, slug, description, logo, isActive } = req.body;
        const brand = await brand_model_1.default.findById(id);
        if (!brand) {
            throw new api_error_1.default(404, "Brand not found");
        }
        if (slug && slug !== brand.slug) {
            const existingBrand = await brand_model_1.default.findOne({
                slug,
                _id: { $ne: id },
            });
            if (existingBrand) {
                throw new api_error_1.default(409, "A brand with the same slug already exists");
            }
        }
        brand.name = name ?? brand.name;
        brand.slug = slug ?? brand.slug;
        brand.description = description ?? brand.description;
        brand.logo = logo ?? brand.logo;
        brand.isActive = isActive ?? brand.isActive;
        await brand.save();
        res.status(200).json(new api_response_1.default("Brand updated successfully", brand));
    }
    catch (error) {
        next(error);
    }
};
exports.updateBrand = updateBrand;
const deleteBrand = async (req, res, next) => {
    try {
        const { id } = req.params;
        const brand = await brand_model_1.default.findById(id);
        if (!brand) {
            throw new api_error_1.default(404, "Brand not found");
        }
        if (!brand.isActive) {
            throw new api_error_1.default(400, "Brand is already inactive");
        }
        brand.isActive = false;
        await brand.save();
        res
            .status(200)
            .json(new api_response_1.default("Brand deactivated successfully", brand));
    }
    catch (error) {
        next(error);
    }
};
exports.deleteBrand = deleteBrand;
