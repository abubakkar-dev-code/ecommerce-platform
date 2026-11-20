"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategories = exports.getCategoriesBySlug = exports.getCategories = exports.createCategory = void 0;
const mongoose_1 = require("mongoose");
const api_error_1 = __importDefault(require("../utils/api-error"));
const category_model_1 = __importDefault(require("../models/category.model"));
const api_response_1 = __importDefault(require("../utils/api-response"));
const catalog_validation_1 = require("../validation/catalog.validation");
const catalog_service_1 = require("../services/catalog.service");
const createCategory = async (req, res, next) => {
    try {
        const { name, slug, description, image, parentCategory, isActive } = (0, catalog_validation_1.parse)(catalog_validation_1.categoryCreate, req.body);
        if (!name || !slug) {
            throw new api_error_1.default(400, "name and slug are required");
        }
        const isDuplicateSlugExist = await category_model_1.default.findOne({ slug });
        if (isDuplicateSlugExist) {
            throw new api_error_1.default(400, "A category with same slug already exist");
        }
        await (0, catalog_service_1.requireCategoryParent)(parentCategory);
        if (parentCategory) {
            const parent = await category_model_1.default.findById(parentCategory);
            if (!parent) {
                throw new api_error_1.default(404, "Parent category not found");
            }
        }
        const category = await category_model_1.default.create({
            name,
            slug,
            description,
            image,
            parentCategory: parentCategory ?? null,
            isActive,
        });
        res.status(201).json(new api_response_1.default("Product category created", category));
    }
    catch (error) {
        next((0, catalog_validation_1.catalogError)(error));
    }
};
exports.createCategory = createCategory;
const getCategories = async (req, res, next) => {
    try {
        const query = (0, catalog_validation_1.parse)(catalog_validation_1.pageQuery, req.query);
        const [categories, totalProducts] = await Promise.all([
            category_model_1.default.find({ isActive: true }).sort({ name: 1, _id: 1 }).skip((query.page - 1) * query.limit).limit(query.limit),
            category_model_1.default.countDocuments({ isActive: true }),
        ]);
        res
            .status(200)
            .json(new api_response_1.default("categories feched successfully", categories, { currentPage: query.page, totalPages: Math.ceil(totalProducts / query.limit), itemsPerPage: query.limit, totalProducts }));
    }
    catch (error) {
        next((0, catalog_validation_1.catalogError)(error));
    }
};
exports.getCategories = getCategories;
const getCategoriesBySlug = async (req, res, next) => {
    try {
        const slug = (0, catalog_validation_1.parse)(catalog_validation_1.slug, req.params.slug);
        const query = (0, catalog_validation_1.parse)(catalog_validation_1.pageQuery, req.query);
        const category = await category_model_1.default.findOne({ slug, isActive: true });
        if (!category) {
            throw new api_error_1.default(404, "category not found");
        }
        const filter = { parentCategory: category._id, isActive: true };
        const [childCategory, totalProducts] = await Promise.all([
            category_model_1.default.find(filter).sort({ name: 1, _id: 1 }).skip((query.page - 1) * query.limit).limit(query.limit),
            category_model_1.default.countDocuments(filter),
        ]);
        res
            .status(200)
            .json(new api_response_1.default("child categories fetched by parent", childCategory, { currentPage: query.page, totalPages: Math.ceil(totalProducts / query.limit), itemsPerPage: query.limit, totalProducts }));
    }
    catch (error) {
        next((0, catalog_validation_1.catalogError)(error));
    }
};
exports.getCategoriesBySlug = getCategoriesBySlug;
const updateCategories = async (req, res, next) => {
    try {
        const id = (0, catalog_validation_1.parse)(catalog_validation_1.objectId, req.params.id);
        const { name, slug, description, image, parentCategory, isActive } = (0, catalog_validation_1.parse)(catalog_validation_1.categoryUpdate, req.body);
        if (!name && !slug && description === undefined && image === undefined && parentCategory === undefined && isActive === undefined) {
            throw new api_error_1.default(400, "name and slug are required");
        }
        const category = await category_model_1.default.findById(id);
        if (!category) {
            throw new api_error_1.default(404, "Category not found");
        }
        if (slug && slug !== category.slug) {
            const existingCategory = await category_model_1.default.findOne({
                slug,
                _id: { $ne: id },
            });
            if (existingCategory) {
                throw new api_error_1.default(409, "A category with same slug already exist");
            }
        }
        await (0, catalog_service_1.requireCategoryParent)(parentCategory, id);
        if (parentCategory !== null && parentCategory !== undefined) {
            if (parentCategory === id) {
                throw new api_error_1.default(409, "A category cannot be its own parent Category");
            }
            const parent = await category_model_1.default.findById(parentCategory);
            if (!parent) {
                throw new api_error_1.default(404, "Parent category not found");
            }
        }
        category.name = name ?? category.name;
        category.slug = slug ?? category.slug;
        category.description = description ?? category.description;
        category.image = image ?? category.image;
        if (parentCategory !== undefined)
            category.parentCategory = parentCategory ? new mongoose_1.Types.ObjectId(parentCategory) : null;
        category.isActive = isActive ?? category.isActive;
        await category.save();
        res
            .status(201)
            .json(new api_response_1.default("categories updated successfull", category));
    }
    catch (error) {
        next((0, catalog_validation_1.catalogError)(error));
    }
};
exports.updateCategories = updateCategories;
const deleteCategory = async (req, res, next) => {
    try {
        const id = (0, catalog_validation_1.parse)(catalog_validation_1.objectId, req.params.id);
        const category = await category_model_1.default.findById(id);
        if (!category) {
            throw new api_error_1.default(404, "Category not found");
        }
        if (!category.isActive) {
            throw new api_error_1.default(409, "category is already inactive");
        }
        category.isActive = false;
        await category.save();
        res.status(201).json(new api_response_1.default("product deleted successfully"));
    }
    catch (error) {
        next((0, catalog_validation_1.catalogError)(error));
    }
};
exports.deleteCategory = deleteCategory;
