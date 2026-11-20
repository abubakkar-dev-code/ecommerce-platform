import { useRef, useState } from "react";
import { isAxiosError } from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import type { Product } from "../../redux/slices/productSlice";
import type { RootState } from "../../redux/store";
import cartService from "../../services/cartService";
import productService, { getCatalogAvailability } from "../../services/productService";
import apiError from "../../services/apiError";
import CatalogImage from "./CatalogImage";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

export default function ProductCard({ product, brandName, categoryName }: { product: Product; brandName?: string; categoryName?: string }) {
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const session = useSelector((state: RootState) => state.userInfo);
  const navigate = useNavigate();

  const variants = (product.variants ?? []).filter((variant) => Number.isFinite(variant.price) && variant.price >= 0);
  const variant = variants.reduce<(typeof variants)[number] | undefined>(
    (lowest, item) => !lowest || item.price < lowest.price ? item : lowest, undefined,
  );
  const availability = variants.map(getCatalogAvailability);
  const soldOut = variants.length > 0 && availability.every((status) => status === "out-of-stock" || status === "unavailable");
  const image = product.images?.[0];
  const detail = `/products/${product._id}`;
  const signIn = () => navigate("/auth/login", { state: { from: variant ? `${detail}?variant=${encodeURIComponent(variant._id)}` : detail } });

  const add = async () => {
    if (!variant || soldOut || pending.current || session.status === "checking") return;
    if ((product.variants?.length ?? 0) > 1) {
      navigate(detail);
      return;
    }
    if (!session.isAuthenticated) {
      signIn();
      return;
    }
    pending.current = true;
    setBusy(true);
    try {
      if (!await productService.getVariantAvailability(variant._id)) {
        toast.error("This variant is out of stock.");
        return;
      }
      await cartService.addItem(product._id, variant._id, 1);
      toast.success("Added to cart");
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        signIn();
      } else {
        toast.error(apiError(error, "Could not add this item to your cart."));
      }
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  return (
    <article className="flex h-full min-w-0 flex-col rounded-2xl border border-border bg-white p-2.5 transition hover:border-primary/35 hover:shadow-sm sm:p-4">
      <Link to={detail} className="block overflow-hidden rounded-xl bg-[#f8f7fb]">
        <CatalogImage src={image?.primaryImage?.trim() || image?.thumbnails?.find((photo) => photo.url?.trim())?.url}
          alt={product.name} className="aspect-square w-full object-contain p-2 sm:p-4" />
      </Link>
      <div className="flex-1 py-4">
        {(product.brandDetails?.name || brandName || categoryName) && <p className="mb-1 text-xs font-semibold text-muted">{[product.brandDetails?.name ?? brandName, categoryName].filter(Boolean).join(" / ")}</p>}
        <h3 className="line-clamp-2 break-words text-sm font-bold sm:text-base" title={product.name}><Link to={detail} className="hover:text-primary">{product.name}</Link></h3>
        <p className="mt-2 text-sm font-semibold">
          {variant ? <>{variants.length > 1 && "From "}{currency.format(variant.price)}
            {typeof variant.comparedAt === "number" && Number.isFinite(variant.comparedAt) && variant.comparedAt > variant.price && (
              <del className="ml-2 font-normal text-muted">{currency.format(variant.comparedAt)}</del>
            )}</> : "Pricing unavailable"}
        </p>
        {typeof product.rating === "number" && Number.isFinite(product.rating) && <p className="mt-1 text-xs text-muted">Rating {product.rating} / 5</p>}
        {availability.includes("in-stock") && <p className="mt-1 text-xs text-success">In stock</p>}
        {!product.variants?.length && <p className="mt-1 text-xs text-muted">No purchasable variants</p>}
        {soldOut && <p className="mt-1 text-xs text-muted">{availability.every((status) => status === "unavailable") ? "Inventory unavailable" : "Out of stock"} · <Link to={detail} className="font-semibold text-primary">Check current stock</Link></p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => void add()} disabled={!variant || soldOut || busy || session.status === "checking"}
          className="store-button w-full px-2 sm:w-auto sm:px-3">
          {busy ? "Adding..." : (product.variants?.length ?? 0) > 1 ? "Choose options" : "Add to cart"}
        </button>
        <Link to={detail} className="text-sm font-semibold text-primary hover:underline">View product</Link>
      </div>
    </article>
  );
}
