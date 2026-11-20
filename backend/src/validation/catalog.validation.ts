import { z } from "zod";
import ApiError from "../utils/api-error";

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid identifier");
const name = z.string().trim().min(1).max(160);
export const slug = z.string().trim().toLowerCase().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const description = z.string().trim().max(10000);
const imageUrl = z.string().max(2048).refine((value) => {
  if (value === "") return true;
  try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; }
}, "Expected an HTTP(S) URL");
const money = z.number().finite().min(0).max(1_000_000_000).refine(
  (value) => Math.abs(value * 100 - Math.round(value * 100)) < 0.00001,
  "Prices support at most two decimal places",
);
const attributes = z.record(z.string().min(1).max(64).regex(/^[a-zA-Z0-9 _-]+$/), z.string().trim().min(1).max(200))
  .refine((value) => Object.keys(value).length > 0 && Object.keys(value).length <= 30)
  .refine((value) => Object.keys(value).every((key) => !["__proto__", "prototype", "constructor"].includes(key)));

export const productCreate = z.object({ name, slug, description: description.optional(), category: objectId,
  brand: objectId, isActive: z.boolean().optional() }).strict();
export const productUpdate = productCreate.partial().refine((value) => Object.keys(value).length > 0);
export const variantCreate = z.object({ product: objectId,
  sku: z.string().trim().toUpperCase().min(1).max(80).regex(/^[A-Z0-9_-]+$/),
  attributes, price: money, comparedAt: money.optional(), isActive: z.boolean().optional() }).strict()
  .refine((value) => value.comparedAt === undefined || value.comparedAt >= value.price,
    "Compared-at price cannot be below price");
export const variantUpdate = z.object({ attributes: attributes.optional(), price: money.optional(),
  comparedAt: money.optional(), isActive: z.boolean().optional() }).strict()
  .refine((value) => Object.keys(value).length > 0);
export const brandCreate = z.object({ name, slug, description: description.optional(),
  logo: imageUrl.optional(), isActive: z.boolean().optional() }).strict();
export const brandUpdate = brandCreate.partial().refine((value) => Object.keys(value).length > 0);
export const categoryCreate = z.object({ name, slug, description: description.optional(), image: imageUrl.optional(),
  parentCategory: objectId.nullable().optional(), isActive: z.boolean().optional() }).strict();
export const categoryUpdate = categoryCreate.partial().refine((value) => Object.keys(value).length > 0);

const positiveInteger = (max: number) => z.string().regex(/^[1-9]\d*$/).transform(Number).pipe(z.number().int().max(max));
const queryMoney = z.string().regex(/^\d+(?:\.\d{1,2})?$/).transform(Number).pipe(money);
export const catalogQuery = z.object({ page: positiveInteger(10000).default(1), limit: positiveInteger(100).default(9),
  search: z.string().trim().min(1).max(100).optional(), category: objectId.optional(), brand: objectId.optional(),
  minPrice: queryMoney.optional(), maxPrice: queryMoney.optional(), includeSubcategories: z.literal("true").optional(),
  sort: z.enum(["name-asc", "name-dsc", "name-desc", "newest", "oldest", "price-asc", "price-desc"]).default("newest"),
}).strict().refine((value) => value.minPrice === undefined || value.maxPrice === undefined || value.minPrice <= value.maxPrice,
  "Minimum price cannot exceed maximum price");
export const pageQuery = z.object({ page: positiveInteger(10000).default(1), limit: positiveInteger(100).default(9) }).strict();

export const parse = <T>(schema: z.ZodType<T>, input: unknown): T => {
  const result = schema.safeParse(input);
  if (!result.success) throw new ApiError(400, "Invalid catalog input");
  return result.data;
};
export const escapeSearch = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const catalogError = (error: unknown): unknown =>
  typeof error === "object" && error !== null && "code" in error && error.code === 11000
    ? new ApiError(409, "Catalog identifier already exists") : error;
