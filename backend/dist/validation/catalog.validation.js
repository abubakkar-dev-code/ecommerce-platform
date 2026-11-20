"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.catalogError = exports.escapeSearch = exports.parse = exports.pageQuery = exports.catalogQuery = exports.categoryUpdate = exports.categoryCreate = exports.brandUpdate = exports.brandCreate = exports.variantUpdate = exports.variantCreate = exports.productUpdate = exports.productCreate = exports.slug = exports.objectId = void 0;
const zod_1 = require("zod");
const api_error_1 = __importDefault(require("../utils/api-error"));
exports.objectId = zod_1.z.string().regex(/^[a-f\d]{24}$/i, "Invalid identifier");
const name = zod_1.z.string().trim().min(1).max(160);
exports.slug = zod_1.z.string().trim().toLowerCase().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const description = zod_1.z.string().trim().max(10000);
const imageUrl = zod_1.z.string().max(2048).refine((value) => {
    if (value === "")
        return true;
    try {
        return ["http:", "https:"].includes(new URL(value).protocol);
    }
    catch {
        return false;
    }
}, "Expected an HTTP(S) URL");
const money = zod_1.z.number().finite().min(0).max(1_000_000_000).refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 0.00001, "Prices support at most two decimal places");
const attributes = zod_1.z.record(zod_1.z.string().min(1).max(64).regex(/^[a-zA-Z0-9 _-]+$/), zod_1.z.string().trim().min(1).max(200))
    .refine((value) => Object.keys(value).length > 0 && Object.keys(value).length <= 30)
    .refine((value) => Object.keys(value).every((key) => !["__proto__", "prototype", "constructor"].includes(key)));
exports.productCreate = zod_1.z.object({ name, slug: exports.slug, description: description.optional(), category: exports.objectId,
    brand: exports.objectId, isActive: zod_1.z.boolean().optional() }).strict();
exports.productUpdate = exports.productCreate.partial().refine((value) => Object.keys(value).length > 0);
exports.variantCreate = zod_1.z.object({ product: exports.objectId,
    sku: zod_1.z.string().trim().toUpperCase().min(1).max(80).regex(/^[A-Z0-9_-]+$/),
    attributes, price: money, comparedAt: money.optional(), isActive: zod_1.z.boolean().optional() }).strict()
    .refine((value) => value.comparedAt === undefined || value.comparedAt >= value.price, "Compared-at price cannot be below price");
exports.variantUpdate = zod_1.z.object({ attributes: attributes.optional(), price: money.optional(),
    comparedAt: money.optional(), isActive: zod_1.z.boolean().optional() }).strict()
    .refine((value) => Object.keys(value).length > 0);
exports.brandCreate = zod_1.z.object({ name, slug: exports.slug, description: description.optional(),
    logo: imageUrl.optional(), isActive: zod_1.z.boolean().optional() }).strict();
exports.brandUpdate = exports.brandCreate.partial().refine((value) => Object.keys(value).length > 0);
exports.categoryCreate = zod_1.z.object({ name, slug: exports.slug, description: description.optional(), image: imageUrl.optional(),
    parentCategory: exports.objectId.nullable().optional(), isActive: zod_1.z.boolean().optional() }).strict();
exports.categoryUpdate = exports.categoryCreate.partial().refine((value) => Object.keys(value).length > 0);
const positiveInteger = (max) => zod_1.z.string().regex(/^[1-9]\d*$/).transform(Number).pipe(zod_1.z.number().int().max(max));
const queryMoney = zod_1.z.string().regex(/^\d+(?:\.\d{1,2})?$/).transform(Number).pipe(money);
exports.catalogQuery = zod_1.z.object({ page: positiveInteger(10000).default(1), limit: positiveInteger(100).default(9),
    search: zod_1.z.string().trim().min(1).max(100).optional(), category: exports.objectId.optional(), brand: exports.objectId.optional(),
    minPrice: queryMoney.optional(), maxPrice: queryMoney.optional(),
    sort: zod_1.z.enum(["name-asc", "name-dsc", "name-desc", "newest", "oldest", "price-asc", "price-desc"]).default("newest"),
}).strict().refine((value) => value.minPrice === undefined || value.maxPrice === undefined || value.minPrice <= value.maxPrice, "Minimum price cannot exceed maximum price");
exports.pageQuery = zod_1.z.object({ page: positiveInteger(10000).default(1), limit: positiveInteger(100).default(9) }).strict();
const parse = (schema, input) => {
    const result = schema.safeParse(input);
    if (!result.success)
        throw new api_error_1.default(400, "Invalid catalog input");
    return result.data;
};
exports.parse = parse;
const escapeSearch = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
exports.escapeSearch = escapeSearch;
const catalogError = (error) => typeof error === "object" && error !== null && "code" in error && error.code === 11000
    ? new api_error_1.default(409, "Catalog identifier already exists") : error;
exports.catalogError = catalogError;
