import { useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import { useSelector } from "react-redux";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import productPlaceholder from "../../componenets/products/product-placeholder.svg";
import type { Product, ProductVariant } from "../../redux/slices/productSlice";
import type { RootState } from "../../redux/store";
import cartService from "../../services/cartService";
import accountService from "../../services/accountService";
import apiError from "../../services/apiError";
import productService, { getCatalogAvailability } from "../../services/productService";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });
const pageClass = "store-page";

function GalleryImage({ src, alt, className }: { src?: string; alt: string; className: string }) {
  const [failed, setFailed] = useState(false);
  const source = src && !failed ? src : undefined;

  return (
    <img
      src={source ?? productPlaceholder}
      alt={alt}
      className={className}
      onError={source ? () => setFailed(true) : undefined}
    />
  );
}

function ProductGallery({ product }: { product: Product }) {
  const images = product.images?.[0];
  const primaryImage = images?.primaryImage?.trim();
  const photos = [
    ...(primaryImage ? [{ src: primaryImage, label: "Primary image" }] : []),
    ...(images?.thumbnails ?? []).flatMap(({ url }, index) => {
      const src = url.trim();
      return src ? [{ src, label: `Product image ${index + 2}` }] : [];
    }),
  ];
  const [selectedPhoto, setSelectedPhoto] = useState(photos[0]?.src);
  const preview = useRef<HTMLDialogElement>(null);

  return (
    <section className="min-w-0" aria-label="Product images">
      <button type="button" disabled={!selectedPhoto} aria-label="Enlarge product image"
        onClick={() => preview.current?.showModal()}
        className="block aspect-square w-full overflow-hidden rounded-2xl border border-border bg-surface enabled:cursor-zoom-in">
        <GalleryImage key={selectedPhoto} src={selectedPhoto} alt={product.name} className="h-full w-full object-contain" />
      </button>
      <dialog ref={preview} aria-label="Enlarged product image" className="m-auto w-[min(90vw,56rem)] rounded-2xl p-4 backdrop:bg-black/70">
        <form method="dialog" className="mb-2 text-right"><button className="rounded-lg border px-3 py-2">Close</button></form>
        <GalleryImage key={selectedPhoto} src={selectedPhoto} alt={product.name} className="max-h-[75dvh] w-full object-contain" />
      </dialog>
      {photos.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-3">
          {photos.map(({ src, label }, index) => (
            <button
              key={`${src}-${index}`}
              type="button"
              aria-label={label}
              aria-pressed={src === selectedPhoto}
              onClick={() => setSelectedPhoto(src)}
              className="h-16 w-16 overflow-hidden rounded-lg border border-border bg-surface hover:border-primary aria-pressed:ring-2 aria-pressed:ring-primary sm:h-20 sm:w-20"
            >
              <GalleryImage src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

type Availability = "loading" | "in-stock" | "out-of-stock" | "unavailable" | "error";

const availabilityMessages: Record<Availability, string> = {
  loading: "Checking stock…",
  "in-stock": "In stock",
  "out-of-stock": "Out of stock",
  unavailable: "Inventory is unavailable for this variant.",
  error: "Couldn’t check stock. Select the variant again or refresh the page.",
};

function VariantPurchase({ productId, variant }: { productId: string; variant: ProductVariant }) {
  const [stock, setStock] = useState<{ version: number; availability: Availability }>();
  const [action, setAction] = useState<"cart" | "buy">();
  const pending = useRef(false);
  const [quantity, setQuantity] = useState("1");
  const [stockVersion, setStockVersion] = useState(0);
  const reportedAvailability = getCatalogAvailability(variant);
  const needsStockRequest = stockVersion > 0 || reportedAvailability === undefined;
  const availability = needsStockRequest
    ? (stock?.version === stockVersion ? stock.availability : "loading")
    : reportedAvailability;
  const validQuantity = /^[1-9]\d*$/.test(quantity) && Number.isSafeInteger(Number(quantity));
  const { isAuthenticated, status: sessionStatus } = useSelector((state: RootState) => state.userInfo);
  const navigate = useNavigate();
  const { pathname, search } = useLocation();

  useEffect(() => {
    if (!needsStockRequest) return;
    const controller = new AbortController();
    productService.getVariantAvailability(variant._id, controller.signal)
      .then((inStock) => {
        if (!controller.signal.aborted) setStock({ version: stockVersion, availability: inStock ? "in-stock" : "out-of-stock" });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setStock({ version: stockVersion, availability: isAxiosError(error) && error.response?.status === 404 ? "unavailable" : "error" });
      });
    return () => controller.abort();
  }, [variant._id, stockVersion, needsStockRequest]);

  const signIn = () => {
    const query = new URLSearchParams(search);
    query.set("variant", variant._id);
    navigate("/auth/login", { state: { from: pathname + "?" + query.toString() } });
  };

  const canPurchase = availability === "in-stock" && sessionStatus !== "checking" && validQuantity && Number.isFinite(variant.price);

  const addToCart = async (destination: "cart" | "buy") => {
    if (!canPurchase || pending.current) return;
    if (!isAuthenticated) {
      signIn();
      return;
    }

    pending.current = true;
    setAction(destination);
    try {
      if (!await productService.getVariantAvailability(variant._id, undefined, Number(quantity))) {
        toast.error("The requested quantity is unavailable.");
        return;
      }
      if (destination === "buy") {
        const intent = new URLSearchParams({ product: productId, variant: variant._id, quantity });
        navigate("/checkout?" + intent.toString());
      } else {
        await cartService.addItem(productId, variant._id, Number(quantity));
        toast.success("Added to cart");
      }
    } catch (error) {
      if (isAxiosError<{ message?: string }>(error)) {
        if (error.response?.status === 401) {
          signIn();
          return;
        }
        toast.error(error.response?.data?.message || "Couldn’t add this item to your cart.");
      } else {
        toast.error("Couldn’t add this item to your cart.");
      }
    } finally {
      pending.current = false;
      setAction(undefined);
      setStockVersion((version) => version + 1);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="text-3xl font-bold">{Number.isFinite(variant.price) ? currency.format(variant.price) : "Pricing unavailable"}</span>
        {typeof variant.comparedAt === "number" && Number.isFinite(variant.comparedAt) && variant.comparedAt > variant.price && (
          <del className="text-lg text-muted">{currency.format(variant.comparedAt)}</del>
        )}
      </div>
      <p role="status" className={availability === "in-stock" ? "text-sm font-medium text-success" : "text-sm text-muted"}>
        {availabilityMessages[availability]}
      </p>
      {(availability === "error" || availability === "unavailable" || availability === "out-of-stock") && <button type="button" onClick={() => setStockVersion((version) => version + 1)}
        className="text-sm font-semibold text-primary hover:underline">Check stock again</button>}
      <label className="grid w-28 gap-1 text-sm font-semibold">Quantity
        <input type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)}
          className="rounded-lg border border-border px-3 py-2" />
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => void addToCart("cart")}
          disabled={!canPurchase || !!action}
          className="rounded-xl border border-primary px-6 py-3 font-semibold text-primary hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-border disabled:text-muted"
        >
          {action === "cart" ? "Adding..." : "Add to Cart"}
        </button>
        <button
          type="button"
          onClick={() => void addToCart("buy")}
          disabled={!canPurchase || !!action}
          className="rounded-xl bg-primary px-6 py-3 font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-muted"
        >
          {action === "buy" ? "Opening checkout..." : "Buy Now"}
        </button>
      </div>
      {canPurchase && <p className="text-sm text-muted">Buy Now opens checkout for this item. Your cart stays as it is.</p>}
    </div>
  );
}

function SaveProduct({ id }: { id: string }) {
  const authenticated = useSelector((state: RootState) => state.userInfo.isAuthenticated);
  const state = useSelector((store: RootState) => store.userInfo.status);
  const navigate = useNavigate();
  const location = useLocation();
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (pending.current) return;
    if (!authenticated) {
      navigate("/auth/login", { state: { from: location.pathname + location.search } });
      return;
    }
    pending.current = true;
    setBusy(true);
    try {
      await accountService.saveProduct(id);
      toast.success("Saved to your wishlist");
    } catch (failure) {
      if (isAxiosError(failure) && failure.response?.status === 401) {
        navigate("/auth/login", { state: { from: location.pathname + location.search } });
      } else {
        toast.error(apiError(failure, "Could not save this product."));
      }
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  return <button type="button" disabled={busy || state === "checking"}
    onClick={() => void save()} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-primary disabled:opacity-50">
    Save to wishlist
  </button>;
}

function ProductContent({ product }: { product: Product }) {
  const variants = product.variants ?? [];
  const [params, setParams] = useSearchParams();
  const selectedVariant = variants.find((variant) => variant._id === params.get("variant")) ?? variants.find((variant) => getCatalogAvailability(variant) === "in-stock") ?? variants[0];

  return (
    <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
      <ProductGallery product={product} />
      <section className="store-panel h-fit space-y-6">
        <div>
          <p className="mb-2 flex flex-wrap gap-3 text-sm font-semibold text-primary">
            {typeof product.brand === "object" && product.brand && <Link to={`/products?brand=${product.brand._id}`}>{product.brand.name}</Link>}
            {product.categories && <Link to={`/products?category=${product.categories._id}`}>{product.categories.name}</Link>}
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{product.name}</h1>
          {product.description && <p className="mt-3 whitespace-pre-line text-muted">{product.description}</p>}
        </div>
        {selectedVariant ? (
          <>
            <label className="block space-y-2">
              <span className="text-sm font-semibold">Variant</span>
              <select
                value={selectedVariant._id}
                onChange={(event) => setParams({ variant: event.target.value }, { replace: true })}
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm focus:border-primary focus:outline-none"
              >
                {variants.map((variant) => (
                  <option key={variant._id} value={variant._id}>
                    {Object.entries(variant.attributes ?? {}).map(([name, value]) => `${name}: ${value}`).join(" · ") || variant.sku}
                  </option>
                ))}
              </select>
            </label>
            <VariantPurchase key={selectedVariant._id} productId={product._id} variant={selectedVariant} />
          </>
        ) : (
          <p className="text-sm text-muted">No variants available.</p>
        )}
        <SaveProduct id={product._id} />
      </section>
    </div>
  );
}

type ProductRequest = { status: "loading" | "not-found" | "error" } | { status: "ready"; product: Product };

function ProductDetailsContent({ productId }: { productId: string }) {
  const [request, setRequest] = useState<ProductRequest>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    productService.getProductById(productId, controller.signal)
      .then((product) => {
        if (!controller.signal.aborted) setRequest({ status: "ready", product });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const notFound = isAxiosError(error) && error.response?.status === 404;
        setRequest({ status: notFound ? "not-found" : "error" });
      });
    return () => controller.abort();
  }, [productId]);

  if (request.status === "ready") return <ProductContent product={request.product} />;
  if (request.status === "loading") return <p role="status" className="text-muted">Loading product…</p>;
  if (request.status === "not-found") return <h1 className="text-2xl font-bold">Product not found</h1>;
  return <p role="alert" className="text-error">Couldn’t load this product. Refresh the page to try again.</p>;
}

export default function ProductDetails() {
  const { productId } = useParams<{ productId: string }>();

  return (
    <div className={pageClass}>
      <Link to="/products" className="mb-6 inline-block text-sm font-semibold text-primary hover:underline">
        Back to products
      </Link>
      {productId && /^[a-f\d]{24}$/i.test(productId) ? (
        <ProductDetailsContent key={productId} productId={productId} />
      ) : (
        <h1 className="text-2xl font-bold">Product not found</h1>
      )}
    </div>
  );
}
