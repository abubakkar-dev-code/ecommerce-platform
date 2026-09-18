"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategories = exports.getCategoriesBySlug = exports.getCategories = exports.createCategory = void 0;
const api_error_1 = __importDefault(require("../utils/api-error"));
const category_model_1 = __importDefault(require("../models/category.model"));
const api_response_1 = __importDefault(require("../utils/api-response"));
const createCategory = async (req, res, next) => {
    try {
        const { name, slug, description, image, parentCategory } = req.body;
        if (!name || !slug) {
            throw new api_error_1.default(400, "name and slug are required");
        }
        const isDuplicateSlugExist = await category_model_1.default.findOne({ slug });
        if (isDuplicateSlugExist) {
            throw new api_error_1.default(400, "A category with same slug already exist");
        }
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
            parentCategory: parentCategory || null,
        });
        res.status(201).json(new api_response_1.default("Product category created", category));
    }
    catch (error) {
        next(error);
    }
};
exports.createCategory = createCategory;
const getCategories = async (_req, res, next) => {
    try {
        const categories = await category_model_1.default.find();
        res
            .status(200)
            .json(new api_response_1.default("categories feched successfully", categories));
    }
    catch (error) {
        next(error);
    }
};
exports.getCategories = getCategories;
const getCategoriesBySlug = async (req, res, next) => {
    try {
        const { slug } = req.params;
        const category = await category_model_1.default.findOne({ slug });
        if (!category) {
            throw new api_error_1.default(404, "category not found");
        }
        const childCategory = await category_model_1.default.find({ parentCategory: category._id });
        res
            .status(200)
            .json(new api_response_1.default("child categories fetched by parent", childCategory));
    }
    catch (error) {
        next(error);
    }
};
exports.getCategoriesBySlug = getCategoriesBySlug;
const updateCategories = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, slug, description, image, parentCategory } = req.body;
        if (!name && !slug) {
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
        category.parentCategory = parentCategory ?? category.parentCategory;
        await category.save();
        res
            .status(201)
            .json(new api_response_1.default("categories updated successfull", category));
    }
    catch (error) {
        next(error);
    }
};
exports.updateCategories = updateCategories;
const deleteCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
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
        next(error);
    }
};
exports.deleteCategory = deleteCategory;
