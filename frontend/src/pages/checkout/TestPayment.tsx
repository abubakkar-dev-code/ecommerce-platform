import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/api";
import accountService, { type Address, type BuyNow, type Order, type PaymentMethod } from "../../services/accountService";
import { useSelector } from "react-redux";
import type { RootState } from "../../redux/store";
import apiError from "../../services/apiError";
import type { Cart } from "../../services/cartService";

type CheckoutResult = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type PaymentOrder = { razorpayOrderId: string; amount: number; currency: string; razorpayKeyId: string };
type CheckoutOptions = {
  key: string; order_id: string; amount: number; currency: string; name: string;
  handler: (result: CheckoutResult) => void; modal: { ondismiss: () => void };
};
type CheckoutWindow = Window & { Razorpay?: new (options: CheckoutOptions) => {
  open: () => void;
  on: (event: "payment.failed", listener: () => void) => void;
} };
let loadingScript: Promise<void> | undefined;

function loadCheckout() {
  if ((window as CheckoutWindow).Razorpay) return Promise.resolve();
  loadingScript ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      script.remove();
      loadingScript = undefined;
      reject(new Error("Payment service could not load."));
    };
    document.head.append(script);
  });
  return loadingScript;
}

type CheckoutAttempt = { fingerprint: string; key: string; addressId: string; orderId?: string };

function readAttempt(key: string): CheckoutAttempt | undefined {
  try {
    const value = JSON.parse(sessionStorage.getItem(key) ?? "null") as Partial<CheckoutAttempt> | null;
    if (value && typeof value.fingerprint === "string" && typeof value.key === "string" && typeof value.addressId === "string") {
      return { fingerprint: value.fingerprint, key: value.key, addressId: value.addressId, orderId: typeof value.orderId === "string" ? value.orderId : undefined };
    }
  } catch { /* Unavailable storage is surfaced when starting checkout. */ }
  return undefined;
}

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

export default function TestPayment({ cart, addresses, buyNow, onlineAvailable }: { cart: Cart; addresses: Address[]; buyNow?: BuyNow; onlineAvailable: boolean }) {
  const [selected, setSelected] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(onlineAvailable ? "razorpay" : "cod");
  const [order, setOrder] = useState<Order>();
  const userId = useSelector((state: RootState) => state.userInfo.users?._id);
  const storageKey = "nexora-test-checkout:" + (userId ?? "session") + (buyNow ? `:buy:${buyNow.productId}:${buyNow.variantId}:${buyNow.quantity}` : "");
  const [attempt, setAttempt] = useState(() => readAttempt(storageKey));
  const [loadedOrderId, setLoadedOrderId] = useState<string>();
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const navigate = useNavigate();
  const addressId = addresses.some((item) => item._id === selected) ? selected
    : addresses.find((item) => item.isDefault)?._id ?? addresses[0]?._id;
  const unavailable = !cart.cartItems.length || cart.cartItems.some((item) => item.availability !== "in-stock");
  const recoveryId = attempt?.orderId;
  const recovering = !!recoveryId && recoveryId !== loadedOrderId;
  const fingerprint = JSON.stringify([addressId, ...cart.cartItems.map((item) => [item._id, item.quantity]).sort(), ...(paymentMethod === "cod" ? ["cod"] : [])]);

  const retrying = !recoveryId && attempt?.fingerprint === fingerprint;

  useEffect(() => {
    if (!recoveryId) return;
    const request = new AbortController();
    const reload = () => accountService.getOrder(recoveryId, request.signal).then((result) => {
      if (!request.signal.aborted) { setOrder(result); setLoadedOrderId(recoveryId); }
    }).catch((failure: unknown) => {
      if (!request.signal.aborted) setError(apiError(failure, "Could not recover your order."));
    });
    void reload();
    window.addEventListener("focus", reload);
    return () => { request.abort(); window.removeEventListener("focus", reload); };
  }, [recoveryId, refresh]);

  const run = async (action: () => Promise<void>) => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try { await action(); }
    catch (failure) { setError(apiError(failure, "Checkout could not continue. Check your order status before trying again.")); }
    finally { pending.current = false; setBusy(false); }
  };

  const reserve = () => void run(async () => {
    if (!addressId || (unavailable && !retrying)) return;
    const current = retrying && attempt ? attempt : { fingerprint, key: crypto.randomUUID(), addressId };
    sessionStorage.setItem(storageKey, JSON.stringify(current));
    setAttempt(current);
    const response = await api.post<{ data: Order }>("/orders", { addressId: current.addressId, paymentMethod, ...(buyNow ? { buyNow } : {}) }, { headers: { "Idempotency-Key": current.key } });
    const saved = { ...current, orderId: response.data.data._id };
    sessionStorage.setItem(storageKey, JSON.stringify(saved));
    setAttempt(saved);
    setLoadedOrderId(saved.orderId);
    setOrder(response.data.data);
    if (response.data.data.paymentMethod === "cod" && response.data.data.orderStatus === "confirmed") {
      sessionStorage.removeItem(storageKey);
      window.dispatchEvent(new Event("cart-updated"));
      navigate(`/order-details/${saved.orderId}`, { replace: true });
    }
  });

  const pay = (id: string) => void run(async () => {
    const response = await api.post<{ data: PaymentOrder }>("/payment", { orderId: id });
    const payment = response.data.data;
    if (!payment.razorpayKeyId.startsWith("rzp_test_")) throw new Error("Test checkout key is required.");
    await loadCheckout();
    const Razorpay = (window as CheckoutWindow).Razorpay;
    if (!Razorpay) throw new Error("Payment service could not load.");
    await new Promise<void>((resolve, reject) => {
      const checkout = new Razorpay({
        key: payment.razorpayKeyId, order_id: payment.razorpayOrderId, amount: payment.amount, currency: payment.currency,
        name: "Nexora test checkout",
        modal: { ondismiss: () => {
          setRefresh((value) => value + 1);
          resolve();
        } },
        handler: (body) => {
          api.post("/payment/verify", body).then(() => {
            sessionStorage.removeItem(storageKey);
            window.dispatchEvent(new Event("cart-updated"));
            navigate(`/order-details/${id}`, { replace: true });
            resolve();
          }, (failure: unknown) => {
            setRefresh((value) => value + 1);
            reject(failure);
          });
        },
      });
      checkout.on("payment.failed", () => setError("Payment failed. Retry in the payment window or check your order status."));
      checkout.open();
    });
  });

  return <section className="space-y-3 rounded-xl border border-border p-4">
    <h2 className="font-bold">Payment</h2>

    {error && <p role="alert" className="text-sm text-error">{error}</p>}
    {recovering ? <div className="space-y-2">
      <p role="status">Checking your saved checkout...</p>
      {error && <button type="button" className="text-sm font-semibold text-primary" onClick={() => {
        setError(""); setRefresh((value) => value + 1);
      }}>Check again</button>}
      <Link to={`/order-details/${recoveryId}`} className="block text-sm font-semibold text-primary">View saved order</Link>
    </div> : order ? <>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <dt>Subtotal</dt><dd>{currency.format(order.subtotal)}</dd>
        <dt>Shipping</dt><dd>{currency.format(order.shippingCharge)}</dd>
        <dt className="font-bold">Total</dt><dd className="font-bold">{currency.format(order.totalAmount)}</dd>
      </dl>
      {onlineAvailable && order.paymentMethod !== "cod" && order.orderStatus === "pending" && order.paymentStatus === "pending" && <button type="button" disabled={busy} onClick={() => pay(order._id)}
        className="store-button w-full">Pay online in Test Mode</button>}
      <Link to={`/order-details/${order._id}`} className="block text-sm font-semibold text-primary">View order status</Link>
      {order.orderStatus === "pending" && order.paymentStatus === "pending" && <button type="button" disabled={busy} className="text-sm font-semibold text-error"
        onClick={() => { if (window.confirm("Cancel this checkout and release its stock reservation?")) void run(async () => {
          await accountService.cancelOrder(order._id);
          setRefresh((value) => value + 1);
        }); }}>Cancel checkout</button>}
      {(["cancelled", "expired"].includes(order.orderStatus) || order.paymentStatus === "paid") && <button type="button" onClick={() => {
        sessionStorage.removeItem(storageKey);
        setAttempt(undefined);
        setOrder(undefined);
        window.location.reload();
      }} className="text-sm font-semibold text-primary">Start a new checkout</button>}
    </> : <>
      <label className="grid gap-1 text-sm font-semibold">Shipping address
        <select disabled={busy || !addresses.length} value={addressId ?? ""} onChange={(event) => setSelected(event.target.value)}
          className="w-full rounded-lg border border-border p-2">
          {!addresses.length && <option value="">Add a shipping address first</option>}
          {addresses.map((item) => <option key={item._id} value={item._id}>{item.fullName} · {item.addressLine1}</option>)}
        </select>
      </label>
      <fieldset className="grid gap-2" disabled={busy}>
        <legend className="mb-2 text-sm font-semibold">Payment method</legend>
        <label className="flex gap-3 rounded-xl border border-border p-3 text-sm"><input type="radio" name="payment-method" value="cod" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} /> Cash on Delivery</label>
        {onlineAvailable && <label className="flex gap-3 rounded-xl border border-border p-3 text-sm"><input type="radio" name="payment-method" value="razorpay" checked={paymentMethod === "razorpay"} onChange={() => setPaymentMethod("razorpay")} /> Online payment via Razorpay (Test Mode)</label>}
      </fieldset>
      <button type="button" disabled={busy || (unavailable && !retrying) || !addressId} onClick={reserve}
        className="store-button w-full">{retrying ? "Resume checkout" : paymentMethod === "cod" ? "Place COD order" : "Reserve items and review total"}</button>
      {unavailable && !retrying && <p className="text-sm text-muted">Check your cart for items that need attention.</p>}
    </>}
    {busy && <p role="status" className="text-sm text-muted">Checkout in progress...</p>}
  </section>;
}
