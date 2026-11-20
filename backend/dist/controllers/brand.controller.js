"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBrand = exports.updateBrand = exports.getBrandById = exports.getBrands = exports.createBrand = void 0;
const api_error_1 = __importDefault(require("../utils/api-error"));
const brand_model_1 = __importDefault(require("../models/brand.model"));
const api_response_1 = __importDefault(require("../utils/api-response"));
const catalog_validation_1 = require("../validation/catalog.validation");
const createBrand = async (req, res, next) => {
    try {
        const { name, slug, description, logo, isActive } = (0, catalog_validation_1.parse)(catalog_validation_1.brandCreate, req.body);
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
            isActive,
        });
        res.status(201).json(new api_response_1.default("Brand created successfully", brand));
    }
    catch (error) {
        next((0, catalog_validation_1.catalogError)(error));
    }
};
exports.createBrand = createBrand;
const getBrands = async (req, res, next) => {
    try {
        const query = (0, catalog_validation_1.parse)(catalog_validation_1.pageQuery, req.query);
        const [brands, totalProducts] = await Promise.all([
            brand_model_1.default.find({ isActive: true }).sort({ name: 1, _id: 1 }).skip((query.page - 1) * query.limit).limit(query.limit),
            brand_model_1.default.countDocuments({ isActive: true }),
        ]);
        if (!brands) {
            throw new api_error_1.default(404, "No brands found for this category");
        }
        res
            .status(200)
            .json(new api_response_1.default("Brands details fetched successfully", brands, { currentPage: query.page, totalPages: Math.ceil(totalProducts / query.limit), itemsPerPage: query.limit, totalProducts }));
    }
    catch (error) {
        next((0, catalog_validation_1.catalogError)(error));
    }
};
exports.getBrands = getBrands;
const getBrandById = async (req, res, next) => {
    try {
        const id = (0, catalog_validation_1.parse)(catalog_validation_1.objectId, req.params.id);
        const brand = await brand_model_1.default.findById(id);
        if (!brand || !brand.isActive) {
            throw new api_error_1.default(404, "Brand not found");
        }
        res.status(200).json(new api_response_1.default("Brand fetched successfully", brand));
    }
    catch (error) {
        next((0, catalog_validation_1.catalogError)(error));
    }
};
exports.getBrandById = getBrandById;
const updateBrand = async (req, res, next) => {
    try {
        const id = (0, catalog_validation_1.parse)(catalog_validation_1.objectId, req.params.id);
        const { name, slug, description, logo, isActive } = (0, catalog_validation_1.parse)(catalog_validation_1.brandUpdate, req.body);
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
        next((0, catalog_validation_1.catalogError)(error));
    }
};
exports.updateBrand = updateBrand;
const deleteBrand = async (req, res, next) => {
    try {
        const id = (0, catalog_validation_1.parse)(catalog_validation_1.objectId, req.params.id);
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
        next((0, catalog_validation_1.catalogError)(error));
    }
};
exports.deleteBrand = deleteBrand;
