import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import accountService, { type Order } from "../../services/accountService";
import apiError from "../../services/apiError";
import OrderStatus from "../../componenets/UI/OrderStatus";
import CatalogImage from "../../componenets/products/CatalogImage";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

function OrderContent({ id }: { id: string }) {
  const [order, setOrder] = useState<Order>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const pending = useRef(false);

  const awaitingPayment = order?.orderStatus === "pending" && order.paymentStatus === "pending";

  useEffect(() => {
    const request = new AbortController();
    accountService.getOrder(id, request.signal).then(
      (data) => {
        if (!request.signal.aborted) {
          setOrder(data);
          setError("");
          if (awaitingPayment && data.paymentStatus === "paid") window.dispatchEvent(new Event("cart-updated"));
        }
      },
      (failure: unknown) => { if (!request.signal.aborted) setError(apiError(failure, "Could not load this order.")); },
    );
    return () => request.abort();
  }, [id, refresh, awaitingPayment]);

  useEffect(() => {
    if (!awaitingPayment) return;
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") setRefresh((value) => value + 1); }, 10000);
    return () => window.clearInterval(timer);
  }, [awaitingPayment]);

  const cancel = async () => {
    if (pending.current || !window.confirm("Cancel this order?")) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      await accountService.cancelOrder(id);
      setRefresh((value) => value + 1);
      setOrder(undefined);
    } catch (failure) {
      setError(apiError(failure, "Could not cancel this order."));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  if (!order) return error ? <p role="alert">{error}</p> : <p role="status">Loading order...</p>;
  const address = order.shippingAddress;
  const canCancel = order.paymentStatus !== "paid" && ["pending", "confirmed", "processing"].includes(order.orderStatus);

  return <>
    <h1 className="store-title">{order.orderStatus === "confirmed" && (order.paymentStatus === "paid" || order.paymentMethod === "cod") ? "Order placed successfully" : "Order details"}</h1>
    <p className="break-all text-sm text-muted">Order ID {order._id}</p>
    <p className="text-sm text-muted">{new Date(order.createdAt).toLocaleDateString("en-IN")}</p>
    <div className="flex flex-wrap gap-2"><OrderStatus status={order.orderStatus} label="Order" /><OrderStatus status={order.paymentStatus} label="Payment" /></div>
    {order.paymentMethod === "cod" && <p className="text-sm text-muted">Cash on Delivery{order.paymentStatus === "pending" && order.orderStatus !== "cancelled" ? " · Payment due on delivery" : ""}</p>}
    {error && <p role="alert" className="text-error">{error}</p>}
    <div className="grid items-start gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <section className="store-panel space-y-4">
        <h2 className="font-bold">Items</h2>
        {order.items.map((item) => <div key={item._id} className="flex flex-wrap justify-between gap-3 border-t border-border pt-3">
          <div className="flex min-w-0 gap-3">
            {item.image && <CatalogImage src={item.image} alt="" className="size-14 shrink-0 rounded-lg bg-surface object-contain" />}
            <div className="min-w-0 break-words">
            <p className="font-medium">{item.productName ?? item.product?.name ?? "Unavailable product"}</p>
            <p className="text-sm text-muted">{item.sku ?? item.varient?.sku} · Quantity {item.quantity}</p>
            {Object.entries(item.attributes ?? item.varient?.attributes ?? {}).length > 0 && <p className="text-sm text-muted">
              {Object.entries(item.attributes ?? item.varient?.attributes ?? {}).map(([label, value]) => `${label} ${value}`).join(" · ")}
            </p>}
            </div>
          </div>
          <p className="text-sm">{currency.format(item.price)} each</p>
        </div>)}
      </section>
      <section className="store-panel space-y-4">
        <h2 className="font-bold">Shipping address</h2>
        <address className="break-words text-sm not-italic text-muted">
          {address.fullName}<br />{address.addressLine1}{address.addressLine2 && <><br />{address.addressLine2}</>}<br />
          {address.city}, {address.state} {address.pincode}<br />{address.country}
        </address>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt>Subtotal</dt><dd className="text-right">{currency.format(order.subtotal)}</dd>
          <dt>Shipping</dt><dd className="text-right">{currency.format(order.shippingCharge)}</dd>
          <dt className="font-bold">{order.paymentStatus === "paid" ? "Total paid" : order.paymentMethod === "cod" && order.orderStatus !== "cancelled" ? "Due on delivery" : "Order total"}</dt><dd className="text-right font-bold">{currency.format(order.totalAmount)}</dd>
        </dl>
      </section>
    </div>
    <nav aria-label="Order actions" className="flex flex-wrap gap-4 text-sm font-semibold text-primary">
      <Link to="/orders">My Orders</Link><Link to="/products">Continue Shopping</Link>
    </nav>
    {canCancel && <button type="button" disabled={busy} onClick={() => void cancel()}
      className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-error disabled:opacity-50">
      {busy ? "Cancelling..." : "Cancel order"}
    </button>}
  </>;
}

export default function OrderDetails() {
  const { orderId } = useParams();
  return <section className="store-page space-y-5">
    <Link to="/orders" className="text-sm font-semibold text-primary hover:underline">Back to orders</Link>
    {orderId && /^[a-f\d]{24}$/i.test(orderId)
      ? <OrderContent key={orderId} id={orderId} /> : <h1 className="store-title">Order not found</h1>}
  </section>;
}
