import { isAxiosError } from "axios";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import productPlaceholder from "../../componenets/products/product-placeholder.svg";
import cartService, { type Cart as CartData, type CartLine } from "../../services/cartService";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

const availabilityLabels: Record<CartLine["availability"], string> = {
  "in-stock": "In stock",
  "out-of-stock": "Out of stock",
  unavailable: "Unavailable",
  unknown: "Couldn’t verify stock",
};

function CartImage({ url, name }: { url?: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const source = url && !failed ? url : undefined;
  return (
    <img
      src={source ?? productPlaceholder}
      alt={name}
      className="size-20 shrink-0 rounded-lg bg-gray-100 object-cover sm:size-28"
      onError={source ? () => setFailed(true) : undefined}
    />
  );
}

type CartRowProps = {
  item: CartLine;
  busy: boolean;
  onChange: (variantId: string, quantity: number) => void;
  onRemove: (variantId: string) => void;
};

function CartRow({ item, busy, onChange, onRemove }: CartRowProps) {
  const { product, varient, quantity, price, itemTotal, image, availability } = item;
  const name = product?.name ?? "Unavailable product";
  const variantLabel = varient
    ? Object.entries(varient.attributes ?? {}).map(([key, value]) => `${key}: ${value}`).join(" · ") || varient.sku
    : "Variant unavailable";

  return (
    <article className="flex flex-col gap-5 rounded-2xl border border-border bg-white p-4 sm:p-5 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex min-w-0 gap-4 sm:gap-6">
        <CartImage key={image} url={image} name={name} />
        <div className="min-w-0">
          <h2 className="font-semibold break-words text-black">{name}</h2>
          <p className="text-sm font-semibold break-words text-muted">{variantLabel}</p>
          <p className="mt-1 text-sm text-muted">{currency.format(price)} each</p>
          <p className={`mt-2 text-sm font-bold ${availability === "in-stock" ? "text-success" : "text-error"}`}>
            {availabilityLabels[availability]}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 xl:gap-6">
        <div className="flex items-center gap-2 rounded-lg border border-gray-400 px-2 py-1">
          <button
            type="button"
            aria-label={`Decrease quantity for ${name}`}
            className="size-8 rounded hover:bg-gray-100 disabled:opacity-40"
            disabled={busy || !varient || quantity <= 1 || availability === "unavailable"}
            onClick={() => varient && onChange(varient._id, quantity - 1)}
          >
            −
          </button>
          <span className="min-w-5 text-center tabular-nums">{quantity}</span>
          <button
            type="button"
            aria-label={`Increase quantity for ${name}`}
            className="size-8 rounded hover:bg-gray-100 disabled:opacity-40"
            disabled={busy || !varient || availability !== "in-stock"}
            onClick={() => varient && onChange(varient._id, quantity + 1)}
          >
            +
          </button>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-black">{currency.format(itemTotal)}</p>
          <button
            type="button"
            aria-label={`Remove ${name}, ${variantLabel}`}
            className="mt-2 rounded-md bg-red-600 px-2 py-1 text-xs text-white disabled:opacity-50"
            disabled={busy || !varient}
            onClick={() => varient && onRemove(varient._id)}
          >
            Remove
          </button>
        </div>
      </div>
    </article>
  );
}

const shoppingLinkClass = "text-sm font-semibold text-primary hover:underline";

function Cart() {
  const [cart, setCart] = useState<CartData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const mutationPending = useRef(false);
  const readController = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    readController.current = controller;
    const refresh = () => {
      if (!mutationPending.current && document.visibilityState === "visible") {
        setAttempt((value) => value + 1);
      }
    };
    window.addEventListener("focus", refresh);
    cartService.getCart(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setCart(data);
          setLoadError(false);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoadError(true);
      });
    return () => {
      controller.abort();
      window.removeEventListener("focus", refresh);
    };
  }, [attempt]);

  const changeCart = async (action: () => Promise<void>) => {
    if (mutationPending.current) return;
    mutationPending.current = true;
    readController.current?.abort();
    setBusy(true);
    setActionError("");
    try {
      await action();
    } catch (error) {
      if (isAxiosError<{ message?: string }>(error) && error.response?.status === 401) {
        setBusy(false);
        mutationPending.current = false;
        return;
      }
      const message = isAxiosError<{ message?: string }>(error) ? error.response?.data?.message : undefined;
      setActionError(message || "Couldn’t update your cart. Please try again.");
    }

    try {
      setCart(await cartService.getCart());
      setLoadError(false);
    } catch {
      setCart(null);
      setLoadError(true);
    } finally {
      setBusy(false);
      mutationPending.current = false;
    }
  };

  const items = cart?.cartItems ?? [];
  const quantity = items.reduce((count, item) => count + item.quantity, 0);
  const canCheckout = !busy && items.every((item) => item.availability === "in-stock");

  return (
    <div className="store-page">
      <h1 className="store-title">Your Cart</h1>
      {actionError && <p role="alert" className="mt-4 text-sm font-semibold text-error">{actionError}</p>}
      {loadError ? (
        <div className="mt-4 text-sm">
          <p role="alert" className="text-error">Couldn’t load your cart.</p>
          <button
            type="button"
            className={`mt-2 ${shoppingLinkClass}`}
            onClick={() => {
              setLoadError(false);
              setActionError("");
              setAttempt((value) => value + 1);
            }}
          >
            Retry
          </button>
        </div>
      ) : !cart ? (
        <div role="status" className="store-empty mt-4"><span>Loading your cart…</span><div aria-hidden="true" className="mt-4 h-24 rounded-xl bg-surface motion-safe:animate-pulse" /></div>
      ) : items.length === 0 ? (
        <div className="store-empty mt-4">
          <p className="mb-3 text-sm text-muted">Your cart is empty.</p>
          <Link to="/products" className={shoppingLinkClass}>Continue shopping</Link>
        </div>
      ) : (
        <>
          <p className="mt-2 text-xs font-bold text-muted">{quantity} {quantity === 1 ? "item" : "items"} in your cart</p>
          <p role="status" className="sr-only">{busy ? "Updating your cart…" : ""}</p>
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(16rem,3fr)] lg:gap-8">
            <div className="space-y-5">
              {items.map((item) => (
                <CartRow
                  key={item._id}
                  item={item}
                  busy={busy}
                  onChange={(id, newQuantity) => void changeCart(() => cartService.updateQuantity(id, newQuantity))}
                  onRemove={(id) => void changeCart(() => cartService.removeItem(id))}
                />
              ))}
            </div>
            <aside className="store-panel h-fit lg:sticky lg:top-32">
              <h2 className="text-2xl font-bold">Order Summary</h2>
              <div className="mt-6 flex justify-between gap-4 border-b border-gray-200 pb-4">
                <span className="text-sm font-bold text-muted">Subtotal</span>
                <span className="font-semibold">{currency.format(cart.totalAmount)}</span>
              </div>
              <div className="mt-5 space-y-3 text-center">
                {!canCheckout && !busy && (
                  <p className="text-sm text-error">Update unavailable items before starting a new checkout.</p>
                )}
                {canCheckout ? (
                  <Link to="/checkout" className="store-button w-full">
                    Proceed to checkout
                  </Link>
                ) : (
                  <Link to="/checkout" className="block text-sm font-semibold text-primary hover:underline">Resume an existing checkout</Link>
                )}
                <Link to="/products" className={shoppingLinkClass}>Continue shopping</Link>
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}

export default Cart;
