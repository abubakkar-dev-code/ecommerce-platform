import { useEffect, useState } from "react";
import productService from "../../services/product.service";
import { useParams } from "react-router-dom";
import cartService from "../../services/cart.service";
import toast from "react-hot-toast";

const ProductDetails = () => {
  const { productId } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [details, setDetais] = useState<any>(null);
  const [selectedVariant, setSelectedvariant] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  useEffect(() => {
    const productDetails = async () => {
      if (!productId) return;
      try {
        setLoading(true);
        const response = await productService.getProductsById(productId);
        setDetais(response.data);
        setSelectedvariant(response.data?.variants?.[0]);
      } catch (error) {
        setError(`Failed to fetch Products`);
      } finally {
        setLoading(false);
      }
    };
    productDetails();
  }, [productId]);
  console.log(`details`, details);
  const addToCart = async () => {
    try {
      setLoading(true);
      const response = await cartService.createCart(
        productId,
        selectedVariant._id,
        quantity,
      );
      console.log("cart-response", response.data);
      toast.success("Added to cart successfully");
    } catch (error) {
      setError("Faied to add te cart");
    }
  };
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <>
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Product Images */}
          <section>
            {/* Main Image */}
            <div className="flex h-[350px] items-center justify-center rounded-xl border border-border bg-surface p-6 sm:h-[400px] lg:h-[450px]">
              <img
                src="https://placehold.co/600x600?text=iPhone+15"
                alt="iPhone 15"
                className="h-full w-full object-contain"
              />
            </div>

            {/* Thumbnail Images */}
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                className="h-20 w-20 rounded-lg border-2 border-primary bg-surface p-2"
              >
                <img
                  src="https://placehold.co/100x100?text=1"
                  alt="Product thumbnail 1"
                  className="h-full w-full object-contain"
                />
              </button>

              <button
                type="button"
                className="h-20 w-20 rounded-lg border border-border bg-surface p-2"
              >
                <img
                  src="https://placehold.co/100x100?text=2"
                  alt="Product thumbnail 2"
                  className="h-full w-full object-contain"
                />
              </button>

              <button
                type="button"
                className="h-20 w-20 rounded-lg border border-border bg-surface p-2"
              >
                <img
                  src="https://placehold.co/100x100?text=3"
                  alt="Product thumbnail 3"
                  className="h-full w-full object-contain"
                />
              </button>

              <button
                type="button"
                className="h-20 w-20 rounded-lg border border-border bg-surface p-2"
              >
                <img
                  src="https://placehold.co/100x100?text=4"
                  alt="Product thumbnail 4"
                  className="h-full w-full object-contain"
                />
              </button>
            </div>
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

              <span className="text-lg text-muted line-through">
                {selectedVariant?.comparedAt}
              </span>
            </div>

            {/* Rating */}
            <div className="mt-4 flex items-center gap-3">
              <div className="flex items-center gap-1 text-sm font-medium text-text">
                ★★★★★
              </div>

              <span className="text-sm text-muted">4.5 (120 reviews)</span>
            </div>

            {/* Variants */}
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-text">
                Select Storage
              </h3>

              <div className="mt-3 flex flex-wrap gap-3">
                {details?.variants?.map((varient) => (
                  <button
                    key={varient._id}
                    type="button"
                    onClick={() => setSelectedvariant(varient)}
                    className={`rounded-md px-5 py-2 text-sm font-medium ${
                      selectedVariant?._id === varient._id
                        ? "border-2 border-primary bg-primary text-white"
                        : "border border-border bg-surface text-text hover:border-primary hover:text-primary"
                    }`}
                  >
                    {varient?.attributes?.ram}/{varient?.attributes?.storage}
                  </button>
                ))}
              </div>
            </div>

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
                className="flex-1 rounded-md bg-primary px-6 py-3 font-medium text-white transition hover:bg-primary-hover"
                onClick={addToCart}
              >
                Add to Cart
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
              <div className="grid grid-cols-2 border-b border-border">
                <div className="bg-background px-5 py-3 text-sm font-medium text-text">
                  Brand
                </div>

                <div className="px-5 py-3 text-sm text-muted">
                  {details?.brand.name}
                </div>
              </div>

              {/* Category */}
              <div className="grid grid-cols-2 border-b border-border">
                <div className="bg-background px-5 py-3 text-sm font-medium text-text">
                  Category
                </div>

                <div className="px-5 py-3 text-sm text-muted">
                  {details?.categories?.name}
                </div>
              </div>

              {/* Storage */}
              <div className="grid grid-cols-2 border-b border-border">
                <div className="bg-background px-5 py-3 text-sm font-medium text-text">
                  Storage
                </div>

                <div className="px-5 py-3 text-sm text-muted">
                  {selectedVariant?.attributes?.storage}
                </div>
              </div>

              {/* Color */}
              <div className="grid grid-cols-2">
                <div className="bg-background px-5 py-3 text-sm font-medium text-text">
                  Color
                </div>

                <div className="px-5 py-3 text-sm text-muted">
                  {selectedVariant?.attributes?.color}
                </div>
              </div>
            </div>
          </div>
        </section>
      </>
    </main>
  );
};

export default ProductDetails;
