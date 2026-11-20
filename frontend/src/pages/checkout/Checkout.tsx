import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import accountService, { type Address, type AddressInput, type BuyNow } from "../../services/accountService";
import cartService, { type Cart } from "../../services/cartService";
import apiError from "../../services/apiError";
import TestPayment from "./TestPayment";
import productService from "../../services/productService";
import CatalogImage from "../../componenets/products/CatalogImage";
import { isAxiosError } from "axios";

const addressFields = [
  ["fullName", "Full name", "name"], ["phone", "Phone", "tel"],
  ["addressLine1", "Street address", "address-line1"], ["addressLine2", "Address line 2 (optional)", "address-line2"],
  ["city", "City", "address-level2"],
  ["state", "State", "address-level1"], ["pincode", "Postal code", "postal-code"], ["country", "Country", "country-name"],
] as const;
const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

async function getDirectCheckout(intent: BuyNow, signal: AbortSignal): Promise<Cart> {
  const product = await productService.getProductById(intent.productId, signal);
  const variant = product.variants.find((entry) => entry._id === intent.variantId);
  if (!variant || !Number.isFinite(variant.price)) throw new Error("The selected variant is unavailable.");
  const stock = await productService.getVariantAvailability(variant._id, signal, intent.quantity)
    .then((value) => value ? "in-stock" as const : "out-of-stock" as const)
    .catch((error: unknown) => {
      if (signal.aborted) throw error;
      return isAxiosError(error) && error.response?.status === 404 ? "unavailable" as const : "unknown" as const;
    });
  const image = product.images?.[0];
  const itemTotal = Math.round(variant.price * 100) * intent.quantity / 100;
  return { cartItems: [{
    _id: variant._id, product: { _id: product._id, name: product.name, isActive: true },
    varient: { ...variant, isActive: true }, quantity: intent.quantity, price: variant.price, itemTotal,
    image: image?.primaryImage || image?.thumbnails?.[0]?.url, availability: stock,
  }], totalAmount: itemTotal };
}

export default function Checkout() {
  const [params] = useSearchParams();
  if (!["product", "variant", "quantity"].some((key) => params.has(key))) return <CheckoutContent />;
  const productId = params.get("product")?.toLowerCase() ?? "";
  const variantId = params.get("variant")?.toLowerCase() ?? "";
  const quantity = Number(params.get("quantity"));
  if (!/^[a-f\d]{24}$/i.test(productId) || !/^[a-f\d]{24}$/i.test(variantId) ||
      !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1_000_000) {
    return <p role="alert" className="mx-auto max-w-5xl p-5">This checkout link is invalid. <Link to="/products" className="text-primary">Browse products</Link></p>;
  }
  return <CheckoutContent key={params.toString()} buyNow={{ productId, variantId, quantity }} />;
}

function CheckoutContent({ buyNow }: { buyNow?: BuyNow }) {
  const [addresses, setAddresses] = useState<Address[]>();
  const [cart, setCart] = useState<Cart>();
  const [editing, setEditing] = useState<Address | "new">();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);

  useEffect(() => {
    const request = new AbortController();
    Promise.all([accountService.getAddresses(request.signal), buyNow ? getDirectCheckout(buyNow, request.signal) : cartService.getCart(request.signal)]).then(
      ([saved, basket]) => { if (!request.signal.aborted) { setAddresses(saved); setCart(basket); } },
      (failure: unknown) => { if (!request.signal.aborted) setError(apiError(failure, buyNow ? "Could not load the selected item." : "Could not load checkout.")); },
    );
    return () => request.abort();
  }, [buyNow]);

  const update = async (action: () => Promise<unknown>, message: string) => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      setEditing(undefined);
      setAddresses(await accountService.getAddresses());
      setNotice(message);
    } catch (failure) {
      setError(apiError(failure, "Could not update your addresses."));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const fields = Object.fromEntries(addressFields.map(([name]) => [name, String(form.get(name) ?? "").trim()]));
    const body = { ...fields, isDefault: form.has("isDefault") } as AddressInput;
    if (Object.entries(fields).some(([key, value]) => key !== "addressLine2" && !value)) {
      setError("Complete all address fields.");
      return;
    }
    void update(() => accountService.saveAddress(body, typeof editing === "object" ? editing._id : undefined), "Address saved.");
  };

  const currentAddress = typeof editing === "object" ? editing : undefined;
  return <section className="store-page space-y-5">
    <Link to="/cart" className="text-sm font-semibold text-primary hover:underline">Back to cart</Link>
    <h1 className="store-title">Checkout</h1>
    {error && <p role="alert" className="text-error">{error}</p>}
    {notice && <p role="status" className="text-success">{notice}</p>}
    {!addresses && !error && <div role="status" className="store-empty">Loading checkout...<div aria-hidden="true" className="mt-4 h-32 rounded-xl bg-surface motion-safe:animate-pulse" /></div>}
    {addresses && cart && <div className="grid items-start gap-5 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <section id="shipping-addresses" className="store-panel space-y-4">
        <div className="flex flex-wrap justify-between gap-2">
          <h2 className="font-bold">Shipping addresses</h2>
          <button type="button" disabled={busy} onClick={() => setEditing("new")} className="text-sm font-semibold text-primary">Add address</button>
        </div>
        {!addresses.length && <p className="text-sm text-muted">Add an address for your next order.</p>}
        {addresses.map((address) => <div key={address._id} className="flex flex-wrap items-start justify-between gap-3 border-t border-border pt-3">
          <div className="min-w-0 break-words text-sm">
            <p className="font-semibold">{address.fullName}{address.isDefault && " · Default"}</p>
            <p>{address.addressLine1}{address.addressLine2 && `, ${address.addressLine2}`}</p>
            <p>{address.city}, {address.state} {address.pincode}, {address.country}</p>
          </div>
          <div className="flex gap-3 text-sm">
            <button type="button" disabled={busy} onClick={() => setEditing(address)} className="text-primary">Edit</button>
            <button type="button" disabled={busy} onClick={() => {
              if (window.confirm("Remove this address?")) void update(() => accountService.deleteAddress(address._id), "Address removed.");
            }} className="text-error">Remove</button>
          </div>
        </div>)}
        {editing && <form key={currentAddress?._id ?? "new"} onSubmit={save} className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
          {addressFields.map(([name, label, autocomplete]) => <label key={name} className="grid gap-1 text-sm font-semibold">{label}
            <input name={name} required={name !== "addressLine2"} defaultValue={currentAddress?.[name]} type={name === "phone" ? "tel" : "text"}
              autoComplete={autocomplete} className="store-input" />
          </label>)}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isDefault" defaultChecked={currentAddress?.isDefault ?? !addresses.length} /> Default address</label>
          <div className="flex gap-3 sm:col-span-2">
            <button disabled={busy} className="store-button">Save address</button>
            <button type="button" disabled={busy} onClick={() => setEditing(undefined)}>Cancel</button>
          </div>
        </form>}
      </section>
      <aside className="store-panel space-y-4">
        <h2 className="font-bold">{buyNow ? "Buy Now summary" : "Cart summary"}</h2>
        {!cart.cartItems.length && <p className="text-sm text-muted">Your cart is empty.</p>}
        {cart.cartItems.map((item) => <div key={item._id} className="flex justify-between gap-3 text-sm">
          <div className="flex min-w-0 gap-3">
            <CatalogImage src={item.image} alt="" className="size-12 shrink-0 rounded-lg bg-surface object-contain" />
            <div className="min-w-0 break-words"><p>{item.product?.name ?? "Unavailable product"}</p>
              {item.varient && <p className="text-muted">{Object.values(item.varient.attributes ?? {}).join(" · ") || item.varient.sku}</p>}
              <p className="text-muted">{currency.format(item.price)} × {item.quantity}</p>
            </div>
          </div>
          <span>{currency.format(item.itemTotal)}</span>
        </div>)}
        <p className="flex justify-between gap-3 border-t border-border pt-3 font-semibold">Items subtotal <span>{currency.format(cart.totalAmount)}</span></p>
        <TestPayment cart={cart} addresses={addresses} buyNow={buyNow} onlineAvailable={
          import.meta.env.VITE_RAZORPAY_TEST_CHECKOUT === "true" ||
          (import.meta.env.DEV && import.meta.env.VITE_RAZORPAY_TEST_CHECKOUT !== "false")
        } />
      </aside>
    </div>}
  </section>;
}
