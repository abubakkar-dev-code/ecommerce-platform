import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Pagination from "../../componenets/products/Pagination";
import ProductCard from "../../componenets/products/ProductCard";
import type { Product } from "../../redux/slices/productSlice";
import productService, { type CatalogOption, type CatalogPagination } from "../../services/productService";
import apiError from "../../services/apiError";
import Drawer from "../../componenets/UI/Drawer";
import { FiSliders } from "react-icons/fi";

const limit = 9;
const sorts = [
  ["newest", "Newest"], ["oldest", "Oldest"], ["price-asc", "Price, low to high"], ["price-desc", "Price, high to low"],
];
const objectId = /^[a-f\d]{24}$/i;
const validPrice = /^\d+(?:\.\d{1,2})?$/;

type Result = { key: string; data: Product[]; pagination: CatalogPagination; brandIds?: string[] } | { key: string; error: string };
type Options = { categories: CatalogOption[]; brands: CatalogOption[] };

export default function Products() {
  const [params, setParams] = useSearchParams();
  const [result, setResult] = useState<Result>();
  const [options, setOptions] = useState<Options>();
  const [optionError, setOptionError] = useState(false);
  const [children, setChildren] = useState<{ category: string; data: CatalogOption[] }>();
  const [attempt, setAttempt] = useState(0);
  const selected = params.get("category") || "";
  const category = objectId.test(selected) ? selected : "";
  const brandParam = params.get("brand") || "";
  const brand = objectId.test(brandParam) ? brandParam : "";
  const search = params.get("search")?.trim().slice(0, 100) || "";
  const minimum = params.get("minPrice") || "";
  const maximum = params.get("maxPrice") || "";
  const minPrice = validPrice.test(minimum) && Number(minimum) <= 1e9 ? minimum : "";
  const maxPrice = validPrice.test(maximum) && Number(maximum) <= 1e9 ? maximum : "";
  const sort = sorts.find(([value]) => value === params.get("sort"))?.[0] || "newest";
  const rawPage = params.get("page") || "";
  const currentPage = /^[1-9]\d*$/.test(rawPage) && Number(rawPage) <= 10_000 ? Number(rawPage) : 1;
  const requestKey = JSON.stringify([category, brand, search, minPrice, maxPrice, sort, currentPage, attempt]);
  const current = result?.key === requestKey ? result : undefined;
  const categoryInfo = options?.categories.find((item) => item._id === category);
  const slug = categoryInfo?.slug;
  const childOptions = children?.category === category ? children.data
    : options?.categories.filter((item) => item.parentCategory === category);
  const products = current && "data" in current ? current.data : [];
  const pagination = current && "pagination" in current ? current.pagination : undefined;
  const relevantBrands = current && "data" in current ? current.brandIds : undefined;
  const error = current && "error" in current ? current.error : undefined;

  useEffect(() => {
    let active = true;
    Promise.all([productService.getCategories(), productService.getBrands()]).then(
      ([categories, brands]) => { if (active) setOptions({ categories, brands }); },
      () => { if (active) setOptionError(true); },
    );
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    productService.getSubcategories(slug).then(
      (data) => { if (active) setChildren({ category, data }); },
      () => { /* The active category list already contains parent relationships. */ },
    );
    return () => { active = false; };
  }, [category, slug]);

  useEffect(() => {
    const controller = new AbortController();
    productService.getProducts({
      page: currentPage, limit, sort, category: category || undefined, brand: brand || undefined,
      includeSubcategories: category ? "true" : undefined,
      search: search || undefined, minPrice: minPrice || undefined, maxPrice: maxPrice || undefined,
    }, controller.signal).then(
      (response) => { if (!controller.signal.aborted) setResult({ key: requestKey, ...response }); },
      (failure: unknown) => {
        if (!controller.signal.aborted) setResult({ key: requestKey, error: apiError(failure, "Could not load products.") });
      },
    );
    return () => controller.abort();
  }, [requestKey, currentPage, sort, category, brand, search, minPrice, maxPrice]);

  const change = (values: Record<string, string>) => {
    const next = new URLSearchParams(params);
    next.delete("page");
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next);
  };

  const fieldClass = "store-input";

  const filterControls = <>
          {optionError && <p role="alert" className="text-sm text-error">Some filters could not be loaded.</p>}
          {!options && !optionError && <p role="status" className="text-sm text-muted">Loading filters...</p>}
          <label className="grid gap-1 text-sm font-semibold">Category
            <select className={fieldClass} value={category} onChange={(event) => change({ category: event.target.value, brand: "" })}>
              <option value="">All categories</option>
              {options?.categories.filter((item) => !item.parentCategory || item._id === category)
                .map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold">Brand
            <select className={fieldClass} value={brand} onChange={(event) => change({ brand: event.target.value })}>
              <option value="">All brands</option>
              {options?.brands.filter((item) => !relevantBrands || relevantBrands.includes(item._id) || item._id === brand).map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
            </select>
          </label>
          <form key={JSON.stringify([minPrice, maxPrice])} className="grid gap-3" onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const min = String(data.get("minPrice"));
            const max = String(data.get("maxPrice"));
            const maximumInput = event.currentTarget.elements.namedItem("maxPrice") as HTMLInputElement;
            if (min && max && Number(min) > Number(max)) {
              maximumInput.setCustomValidity("Maximum price must be at least the minimum price.");
              maximumInput.reportValidity();
              return;
            }
            change({ minPrice: min ? String(Number(min)) : "", maxPrice: max ? String(Number(max)) : "" });
          }}>
            <div className="grid grid-cols-2 gap-2" onChange={(event) => {
              const field = event.currentTarget.querySelector<HTMLInputElement>('[name="maxPrice"]');
              field?.setCustomValidity("");
            }}>
              <label className="grid gap-1 text-sm font-semibold">Min price
                <input name="minPrice" defaultValue={minPrice} className={fieldClass} type="number" min="0" max="1000000000" step="0.01" />
              </label>
              <label className="grid gap-1 text-sm font-semibold">Max price
                <input name="maxPrice" defaultValue={maxPrice} className={fieldClass} type="number" min="0" max="1000000000" step="0.01" />
              </label>
            </div>
            <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">Apply price range</button>
          </form>
          <Link to="/products" className="text-center text-sm font-semibold text-primary hover:underline">Clear filters</Link>
  </>;

  return (
    <div className="store-page">
      <h1 className="store-title">{categoryInfo?.name ?? "All products"}</h1>
      {search && <p className="mt-2 text-muted">Results for “{search}”</p>}
      {categoryInfo?.parentCategory && <Link className="mt-2 inline-block text-sm font-semibold text-primary"
        to={`/products?category=${categoryInfo.parentCategory}`}>Back to parent category</Link>}
      {!!childOptions?.length && (
        <nav aria-label="Subcategories" className="mt-4 flex flex-wrap gap-2">
          {childOptions.map((item) => <button key={item._id} type="button" onClick={() => change({ category: item._id, brand: "" })}
            className="rounded-full border border-border px-4 py-2 text-sm hover:border-primary">{item.name}</button>)}
        </nav>
      )}
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="store-panel hidden gap-4 lg:sticky lg:top-32 lg:grid" aria-label="Product filters">
          <h2 className="text-lg font-bold">Filters</h2>
          {filterControls}
        </aside>
        <div className="lg:hidden">
          <Drawer closeAt={1024} title="Product filters" label={<><FiSliders aria-hidden="true" /> Filters</>}>
            <div className="grid gap-4">{filterControls}</div>
            <form method="dialog" className="mt-5"><button className="store-button w-full">Show products</button></form>
          </Drawer>
        </div>
        <section aria-label="Products" aria-busy={!current}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p aria-live="polite" className="text-sm text-muted">{pagination ? `${pagination.totalProducts} products` : ""}</p>
            <label className="flex items-center gap-2 text-sm font-semibold">Sort
              <select className={fieldClass} value={sort} onChange={(event) => change({ sort: event.target.value })}>
                {sorts.map(([value, name]) => <option key={value} value={value}>{name}</option>)}
              </select>
            </label>
          </div>
          {!current && <div role="status" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <span className="sr-only">Loading products</span>
            {[0, 1, 2].map((item) => <div key={item} aria-hidden="true" className="h-72 rounded-2xl bg-slate-100 motion-safe:animate-pulse" />)}
          </div>}
          {error && <div role="alert" className="rounded-xl border border-border p-5">{error}
            <button type="button" className="ml-3 font-semibold text-primary" onClick={() => setAttempt((value) => value + 1)}>Retry</button>
          </div>}
          {pagination && !products.length && <div className="rounded-xl border border-border p-5 text-muted">
            <p>{pagination.totalProducts ? "No products on this page." : "No products match these filters."}</p>
            {currentPage > 1 && <button type="button" onClick={() => change({})}
              className="mt-2 text-sm font-semibold text-primary hover:underline">Back to the first page</button>}
          </div>}
          <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
            {products.map((product) => <ProductCard key={product._id} product={product}
              brandName={options?.brands.find((item) => item._id === product.brand)?.name}
              categoryName={options?.categories.find((item) => item._id === product.category)?.name} />)}
          </div>
          {pagination && pagination.totalPages > 1 && <div className="mt-8 flex justify-center">
            <Pagination currentPage={Math.min(currentPage, pagination.totalPages)} totalPages={Math.min(10000, pagination.totalPages)}
              onPageChange={(page) => change({ page: String(page) })} />
          </div>}
        </section>
      </div>
    </div>
  );
}
