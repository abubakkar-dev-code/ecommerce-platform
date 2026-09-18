import { useEffect, useState } from "react";
import productService from "../../services/product.service";
import { useParams } from "react-router-dom";
import cartService from "../../services/cart.service";
import toast from "react-hot-toast";
import type { Product, ProductVariant } from "../../types";

const ProductDetails = () => {
  const { productId } = useParams<{ productId: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [details, setDetails] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!productId) return;
      try {
        setLoading(true);
        setError("");
        const response = await productService.getProductsById(productId);
        setDetails(response.data);
        setSelectedVariant(response.data?.variants?.[0] || null);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to fetch product details");
      } finally {
        setLoading(false);
      }
    };
    fetchProductDetails();
  }, [productId]);

  const addToCart = async () => {
    if (!productId || !selectedVariant?._id) {
      toast.error("Please select a variant");
      return;
    }
    try {
      setLoading(true);
      const response = await cartService.createCart(
        productId,
        selectedVariant._id,
        quantity,
      );
      console.log("cart-response", response.data);
      toast.success("Added to cart successfully");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to add to cart";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !details) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-16 text-center text-muted">
        Loading product details...
      </main>
    );
  }

  if (error && !details) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-16 text-center text-error">
        {error}
      </main>
    );
  }

  const primaryImage =
    details?.images?.[0]?.image ||
    "https://placehold.co/600x600?text=" + encodeURIComponent(details?.name || "Product");

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-error border border-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Product Images */}
        <section>
          {/* Main Image */}
          <div className="flex h-[350px] items-center justify-center rounded-xl border border-border bg-surface p-6 sm:h-[400px] lg:h-[450px]">
            <img
              src={primaryImage}
              alt={details?.name || "Product"}
              className="h-full w-full object-contain"
            />
          </div>

          {/* Thumbnail Images */}
          {details?.images && details.images.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {details.images.map((img, idx) => (
                <button
                  key={img._id || idx}
                  type="button"
                  className="h-20 w-20 rounded-lg border border-border bg-surface p-2 hover:border-primary"
                >
                  <img
                    src={img.image}
                    alt={`Product thumbnail ${idx + 1}`}
                    className="h-full w-full object-contain"
                  />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Product Information */}
        <section className="flex flex-col">
          {/* Product Name */}
          <h1 className="text-3xl font-bold text-text">{details?.name}</h1>

          {/* Description */}
          <p className="mt-2 text-sm text-muted">{details?.description}</p>

          {/* Price */}
          <div className="mt-6 flex items-center gap-3">
            <span className="text-2xl font-bold text-text">
              ₹{selectedVariant?.price}
            </span>

            {selectedVariant?.comparedAt && (
              <span className="text-lg text-muted line-through">
                ₹{selectedVariant.comparedAt}
              </span>
            )}
          </div>

          {/* Rating */}
          <div className="mt-4 flex items-center gap-3">
            <div className="flex items-center gap-1 text-sm font-medium text-warning">
              ★★★★★
            </div>
            <span className="text-sm text-muted">4.5 (120 reviews)</span>
          </div>

          {/* Variants */}
          {details?.variants && details.variants.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-text">
                Select Option
              </h3>

              <div className="mt-3 flex flex-wrap gap-3">
                {details.variants.map((varient: ProductVariant) => (
                  <button
                    key={varient._id}
                    type="button"
                    onClick={() => setSelectedVariant(varient)}
                    className={`rounded-md px-5 py-2 text-sm font-medium transition ${
                      selectedVariant?._id === varient._id
                        ? "border-2 border-primary bg-primary text-white"
                        : "border border-border bg-surface text-text hover:border-primary hover:text-primary"
                    }`}
                  >
                    {varient?.attributes?.ram && `${varient.attributes.ram} / `}
                    {varient?.attributes?.storage || varient?.attributes?.color || `₹${varient.price}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-text">Quantity</h3>

            <div className="mt-3 flex w-fit items-center rounded-md border border-border">
              <button
                type="button"
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                className="px-4 py-2 text-lg text-muted transition hover:text-primary"
              >
                −
              </button>

              <span className="border-x border-border px-5 py-2 text-sm font-medium text-text">
                {quantity}
              </span>

              <button
                type="button"
                className="px-4 py-2 text-lg text-muted transition hover:text-primary"
                onClick={() => setQuantity((prev) => prev + 1)}
              >
                +
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={loading}
              className="flex-1 rounded-md bg-primary px-6 py-3 font-medium text-white transition hover:bg-primary-hover disabled:opacity-50"
              onClick={addToCart}
            >
              {loading ? "Adding..." : "Add to Cart"}
            </button>

            <button
              type="button"
              className="flex-1 rounded-md border border-border bg-surface px-6 py-3 font-medium text-text transition hover:border-primary hover:text-primary"
            >
              ♡ Add to Wishlist
            </button>
          </div>
        </section>
      </div>

      <section className="mt-16 border-t border-border pt-10">
        {/* Product Description */}
        <h2 className="text-2xl font-bold text-text">Product Description</h2>

        <p className="mt-4 max-w-4xl leading-7 text-muted">
          {details?.description}
        </p>

        {/* Specifications */}
        <div className="mt-10">
          <h2 className="text-2xl font-bold text-text">Specifications</h2>

          <div className="mt-5 overflow-hidden rounded-xl border border-border">
            {/* Brand */}
            {details?.brand && (
              <div className="grid grid-cols-2 border-b border-border">
                <div className="bg-background px-5 py-3 text-sm font-medium text-text">
                  Brand
                </div>

                <div className="px-5 py-3 text-sm text-muted">
                  {typeof details.brand === "object" ? details.brand.name : details.brand}
                </div>
              </div>
            )}

            {/* Category */}
            {(details?.categories || details?.category) && (
              <div className="grid grid-cols-2 border-b border-border">
                <div className="bg-background px-5 py-3 text-sm font-medium text-text">
                  Category
                </div>

                <div className="px-5 py-3 text-sm text-muted">
                  {details?.categories?.name ||
                    (typeof details?.category === "object" ? details.category.name : details?.category)}
                </div>
              </div>
            )}

            {/* Storage */}
            {selectedVariant?.attributes?.storage && (
              <div className="grid grid-cols-2 border-b border-border">
                <div className="bg-background px-5 py-3 text-sm font-medium text-text">
                  Storage
                </div>

                <div className="px-5 py-3 text-sm text-muted">
                  {selectedVariant.attributes.storage}
                </div>
              </div>
            )}

            {/* Color */}
            {selectedVariant?.attributes?.color && (
              <div className="grid grid-cols-2">
                <div className="bg-background px-5 py-3 text-sm font-medium text-text">
                  Color
                </div>

                <div className="px-5 py-3 text-sm text-muted">
                  {selectedVariant.attributes.color}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};

export default ProductDetails;
