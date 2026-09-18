import { useEffect, useState } from "react";
import ProductCard from "../../components/product/ProductCard";
import productService from "../../services/product.service";
import { Link } from "react-router-dom";
import type { Product } from "../../types";

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await productService.getproducts();
        setProducts(response.data || []);
      } catch (err: any) {
        console.log(err);
        setError(err?.response?.data?.message || "Failed to fetch products");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text">All Products</h1>

        <p className="mt-2 text-muted">Explore our collection of products.</p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-error border border-red-200">
          {error}
        </div>
      )}

      {/* Products Page Content */}
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Filters */}
        <aside className="w-full shrink-0 rounded-xl border border-border bg-surface p-5 lg:w-64">
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-text">Category</h3>

            <div className="mt-4 space-y-3">
              <label className="flex items-center gap-3 text-sm text-text">
                <input type="checkbox" />
                Mobiles
              </label>

              <label className="flex items-center gap-3 text-sm text-text">
                <input type="checkbox" />
                Laptops
              </label>

              <label className="flex items-center gap-3 text-sm text-text">
                <input type="checkbox" />
                Headphones
              </label>

              <label className="flex items-center gap-3 text-sm text-text">
                <input type="checkbox" />
                Cameras
              </label>

              <label className="flex items-center gap-3 text-sm text-text">
                <input type="checkbox" />
                Smart Watches
              </label>
            </div>
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-text">Brand</h3>

              <div className="mt-4 space-y-3">
                <label className="flex items-center gap-3 text-sm text-text">
                  <input type="checkbox" />
                  Apple
                </label>

                <label className="flex items-center gap-3 text-sm text-text">
                  <input type="checkbox" />
                  Samsung
                </label>

                <label className="flex items-center gap-3 text-sm text-text">
                  <input type="checkbox" />
                  Sony
                </label>

                <label className="flex items-center gap-3 text-sm text-text">
                  <input type="checkbox" />
                  boAt
                </label>

                <label className="flex items-center gap-3 text-sm text-text">
                  <input type="checkbox" />
                  Canon
                </label>
              </div>
              {/* Price Range */}
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-text">Price Range</h3>

                <div className="mt-4 flex items-center gap-3">
                  <input
                    type="number"
                    placeholder="Min"
                    className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-primary"
                  />

                  <span className="text-muted">-</span>

                  <input
                    type="number"
                    placeholder="Max"
                    className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-primary"
                  />
                </div>

                <button
                  type="button"
                  className="mt-4 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-hover"
                >
                  Apply
                </button>
              </div>
              <button
                type="button"
                className="mt-8 w-full rounded-md border border-border px-4 py-2 text-sm font-medium text-muted transition hover:border-primary hover:text-primary"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </aside>

        {/* Product Area */}
        <section className="flex-1">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-muted">
              {loading ? "Loading products..." : `Showing ${products.length} products`}
            </p>

            <select
              className="rounded-md border border-border bg-surface px-4 py-2 text-sm text-text outline-none transition focus:border-primary"
              defaultValue=""
            >
              <option value="" disabled>
                Sort by
              </option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>

          {/* Product Grid */}
          {loading && products.length === 0 ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <p className="text-muted">Loading products...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => {
                const primaryImage =
                  product.images?.[0]?.image ||
                  "https://placehold.co/400x400?text=" + encodeURIComponent(product.name);
                const firstVariant = product.variants?.[0];

                return (
                  <Link key={product._id} to={`/products/${product._id}`}>
                    <ProductCard
                      name={product.name}
                      image={primaryImage}
                      price={firstVariant?.price || 0}
                      comparedAt={firstVariant?.comparedAt}
                    />
                  </Link>
                );
              })}
            </div>
          )}

          <div className="mt-10 flex items-center justify-center gap-2">
            <button
              type="button"
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-muted transition hover:border-primary hover:text-primary"
            >
              ←
            </button>

            <button
              type="button"
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-white"
            >
              1
            </button>

            <button
              type="button"
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text transition hover:border-primary hover:text-primary"
            >
              2
            </button>

            <button
              type="button"
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text transition hover:border-primary hover:text-primary"
            >
              3
            </button>

            <button
              type="button"
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text transition hover:border-primary hover:text-primary"
            >
              4
            </button>

            <button
              type="button"
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text transition hover:border-primary hover:text-primary"
            >
              5
            </button>

            <button
              type="button"
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-muted transition hover:border-primary hover:text-primary"
            >
              →
            </button>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Products;
