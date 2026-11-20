import api from "../api/api";
import type { Product, ProductVariant } from "../redux/slices/productSlice";

export interface CatalogQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  includeSubcategories?: "true";
  brand?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
}

export interface CatalogPagination {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalProducts: number;
}

export type CatalogOption = {
  _id: string;
  name: string;
  slug: string;
  parentCategory?: string | null;
  image?: string;
  logo?: string;
};

type CatalogPage<T> = { data: T[]; pagination: CatalogPagination; brandIds?: string[] };

const getProducts = async (params: CatalogQuery = {}, signal?: AbortSignal) =>
  (await api.get<CatalogPage<Product>>("/products", { params, signal })).data;

const getProductById = async (id: string, signal?: AbortSignal) =>
  (await api.get<{ data: Product }>(`/products/${encodeURIComponent(id)}`, { signal })).data.data;

export function getCatalogAvailability(variant: ProductVariant): "in-stock" | "out-of-stock" | "unavailable" | undefined {
  if (variant.inventory === null) return "unavailable";
  if (variant.inventory) {
    if (variant.inventory.varient !== variant._id) return undefined;
    return variant.inventory.inStock ? "in-stock" : "out-of-stock";
  }
  return typeof variant.inStock === "boolean" ? (variant.inStock ? "in-stock" : "out-of-stock") : undefined;
}

const getVariantAvailability = async (id: string, signal?: AbortSignal, quantity = 1) => {
  const response = await api.get<{ data: { inStock: boolean } }>(`/inventories/varient/${encodeURIComponent(id)}`, {
    signal, params: quantity === 1 ? undefined : { quantity },
  });
  const inStock = response.data.data?.inStock;
  if (typeof inStock !== "boolean") throw new Error("Inventory response did not contain availability");
  return inStock;
};

const optionRequests = new Map<string, Promise<CatalogOption[]>>();

function getOptions(path: string) {
  const existing = optionRequests.get(path);
  if (existing) return existing;

  const request = (async () => {
    const options: CatalogOption[] = [];
    let page = 1;
    let totalPages: number;
    do {
      const response = await api.get<CatalogPage<CatalogOption>>(path, { params: { page, limit: 100 } });
      options.push(...response.data.data);
      totalPages = response.data.pagination.totalPages;
      page++;
    } while (page <= totalPages);
    return options;
  })();
  optionRequests.set(path, request);
  const expire = () => { if (optionRequests.get(path) === request) optionRequests.delete(path); };
  void request.then(() => window.setTimeout(expire, 60_000), expire);
  return request;
}

const getCategories = () => getOptions("/categories");
const getBrands = () => getOptions("/brands");
const getSubcategories = (slug: string) => getOptions(`/categories/${encodeURIComponent(slug)}`);

export default { getProducts, getProductById, getVariantAvailability, getCategories, getBrands, getSubcategories };
