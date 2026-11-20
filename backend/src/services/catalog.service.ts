import { Types, type PipelineStage } from "mongoose";
import Product from "../models/product.model";
import Category from "../models/category.model";
import Brand from "../models/brand.model";
import Varient from "../models/productVariant.model";
import ProductImage from "../models/productImageSchema";
import { Inventory } from "../models/Inventory.model";
import ApiError from "../utils/api-error";
import { catalogQuery, escapeSearch, parse } from "../validation/catalog.validation";

export const requireCategoryParent = async (parentId?: string | null, categoryId?: string): Promise<void> => {
  const visited = new Set(categoryId ? [categoryId] : []);
  let cursor = parentId;
  while (cursor) {
    if (visited.has(cursor) || visited.size >= 32) throw new ApiError(409, "Invalid category hierarchy");
    visited.add(cursor);
    const parent = await Category.findById(cursor);
    if (!parent || !parent.isActive) throw new ApiError(409, "Parent category is unavailable");
    cursor = parent.parentCategory ? String(parent.parentCategory) : null;
  }
};

export const requireActiveParents = async (categoryId: string, brandId: string): Promise<void> => {
  const [category, brand] = await Promise.all([Category.findById(categoryId), Brand.findById(brandId)]);
  if (!category || !brand) throw new ApiError(404, "Category or brand not found");
  if (!category.isActive || !brand.isActive) throw new ApiError(409, "Category or brand is inactive");
};

// Bounded facet results and batched enrichment replace per-product query loops.
export const listProducts = async (input: unknown, productId?: string) => {
  const query = parse(catalogQuery, input);
  const match: Record<string, unknown> = { isActive: true };
  if (productId) match._id = new Types.ObjectId(productId);
  if (query.category) {
    const categoryId = new Types.ObjectId(query.category);
    match.category = categoryId;
    if (query.includeSubcategories) {
      const [category] = await Category.aggregate<{ descendants: Array<{ _id: Types.ObjectId }> }>([
        { $match: { _id: categoryId, isActive: true } },
        { $graphLookup: { from: Category.collection.name, startWith: "$_id", connectFromField: "_id",
          connectToField: "parentCategory", as: "descendants", maxDepth: 31, restrictSearchWithMatch: { isActive: true } } },
        { $project: { "descendants._id": 1 } },
      ]).option({ maxTimeMS: 5000 });
      match.category = { $in: category ? [categoryId, ...category.descendants.map((item) => item._id)] : [] };
    }
  }
  if (query.brand && !query.category) match.brand = new Types.ObjectId(query.brand);
  const brandFilter: PipelineStage.Match[] = query.brand && query.category ? [{ $match: { brand: new Types.ObjectId(query.brand) } }] : [];
  const stages: PipelineStage[] = [
    { $match: match },
    { $lookup: { from: Category.collection.name, localField: "category", foreignField: "_id",
      pipeline: [{ $match: { isActive: true } }, { $project: { name: 1, slug: 1 } }], as: "_category" } },
    { $lookup: { from: Brand.collection.name, localField: "brand", foreignField: "_id",
      pipeline: [{ $match: { isActive: true } }, { $project: { name: 1, slug: 1, logo: 1, description: 1, isActive: 1, createdAt: 1, updatedAt: 1, __v: 1 } }], as: "_brand" } },
    { $match: { "_category.0": { $exists: true }, "_brand.0": { $exists: true } } },
    { $lookup: { from: Varient.collection.name, localField: "_id", foreignField: "product",
      pipeline: [{ $match: { isActive: true } }, { $group: { _id: null, minPrice: { $min: "$price" }, maxPrice: { $max: "$price" } } }], as: "_prices" } },
  ];
  if (query.search) {
    const pattern = { $regex: escapeSearch(query.search), $options: "i" };
    stages.push({ $match: { $or: ["name", "slug", "description", "_category.name", "_brand.name"].map((field) => ({ [field]: pattern })) } });
  }
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    // Match a single variant in range, rather than unrelated min/max variants.
    const price: Record<string, number> = {};
    if (query.minPrice !== undefined) price.$gte = query.minPrice;
    if (query.maxPrice !== undefined) price.$lte = query.maxPrice;
    stages.push({ $lookup: { from: Varient.collection.name, localField: "_id", foreignField: "product",
      pipeline: [{ $match: { isActive: true, price } }, { $limit: 1 }, { $project: { _id: 1 } }], as: "_matchingPrice" } },
    { $match: { "_matchingPrice.0": { $exists: true } } });
  }
  stages.push({ $set: { _sortPrice: { $ifNull: [{ $arrayElemAt: ["$_prices.minPrice", 0] }, null] } } });
  const sort: Record<string, 1 | -1> = query.sort === "name-asc" ? { name: 1, _id: 1 }
    : ["name-dsc", "name-desc"].includes(query.sort) ? { name: -1, _id: 1 }
    : query.sort === "oldest" ? { createdAt: 1, _id: 1 }
    : query.sort === "price-asc" ? { _sortPrice: 1, _id: 1 }
    : query.sort === "price-desc" ? { _sortPrice: -1, _id: 1 } : { createdAt: -1, _id: 1 };
  stages.push({ $facet: { total: [...brandFilter, { $count: "count" }],
    ...(query.category ? { brands: [{ $group: { _id: "$brand" } }, { $limit: 10000 }] } : {}), data: [
    ...brandFilter,
    { $sort: sort }, { $skip: (query.page - 1) * query.limit }, { $limit: query.limit },
    { $set: { brandDetails: { $arrayElemAt: ["$_brand", 0] } } },
    { $project: { _category: 0, _brand: 0, _prices: 0, _matchingPrice: 0, _sortPrice: 0 } },
  ] } });
  const [result] = await Product.aggregate<{ data: Array<Record<string, unknown> & { _id: Types.ObjectId; category: Types.ObjectId; brand: Types.ObjectId; brandDetails: { _id: Types.ObjectId; name: string; slug: string; logo?: string } }>; total: Array<{ count: number }>; brands?: Array<{ _id: Types.ObjectId }> }>(stages).option({ maxTimeMS: 5000 });
  const data = result?.data ?? [];
  const ids = data.map((product) => product._id);
  const [variants, images] = ids.length ? await Promise.all([
    Varient.aggregate<{ _id: Types.ObjectId; items: Array<{ _id: Types.ObjectId }> }>([
      { $match: { product: { $in: ids }, isActive: true } }, { $sort: { _id: 1 } },
      { $group: { _id: "$product", items: { $firstN: { input: "$$ROOT", n: 100 } } } },
    ]).option({ maxTimeMS: 5000 }),
    ProductImage.find({ product: { $in: ids }, isActive: true }).limit(query.limit).lean(),
  ]) : [[], []];
  const variantIds = variants.flatMap((entry) => entry.items.map((item) => item._id));
  const stock = variantIds.length ? await Inventory.find({ varient: { $in: variantIds } })
    .select("varient quantity reservedQuantity -_id").lean() : [];
  const availability = new Map(stock.map((item) => [String(item.varient), item.quantity > (item.reservedQuantity ?? 0)]));
  const variantsByProduct = new Map(variants.map((entry) => [String(entry._id),
    entry.items.map((item) => {
      const inStock = availability.get(String(item._id));
      return { ...item, inStock: inStock ?? false, inventory: inStock === undefined ? null : { varient: item._id, inStock } };
    })]));
  const imagesByProduct = new Map(images.map((entry) => [String(entry.product), entry]));
  const totalProducts = result?.total[0]?.count ?? 0;
  return { data: data.map((product) => ({ ...product, variants: variantsByProduct.get(String(product._id)) ?? [],
    images: imagesByProduct.has(String(product._id)) ? [imagesByProduct.get(String(product._id))] : [] })),
    brandIds: result?.brands?.map((item) => String(item._id)),
    pagination: { currentPage: query.page, totalPages: Math.ceil(totalProducts / query.limit), itemsPerPage: query.limit, totalProducts } };
};
