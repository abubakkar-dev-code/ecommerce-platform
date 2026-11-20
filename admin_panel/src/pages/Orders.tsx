import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { errorMessage, request } from "../adminApi";

type Order = {
  _id: string; orderStatus: string; paymentStatus: string; paymentMethod?: "cod" | "razorpay"; totalAmount: number; createdAt: string;
  items?: { _id: string; product?: { name: string }; varient?: { sku: string }; quantity: number }[];
  shippingAddress?: { fullName: string; addressLine1: string; city: string; state: string; pincode: string; country: string };
};
const statusOptions = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "expired", "payment_review"];
const nextStatus: Record<string, string> = { confirmed: "processing", processing: "shipped", shipped: "delivered" };
const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });
const label = (value: string) => value.replaceAll("_", " ");

export default function Orders() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<{ key: string; entries: Order[]; totalPages: number }>();
  const [detail, setDetail] = useState<Order>();
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const page = Math.min(10000, Math.max(1, Number(params.get("page")) || 1));
  const status = params.get("status") ?? "";
  const id = params.get("orderId") ?? "";
  const query = new URLSearchParams({ page: String(page), limit: "12", ...(status ? { status } : {}), ...(id ? { orderId: id } : {}) }).toString();

  useEffect(() => {
    const controller = new AbortController();
    request<Order[]>("/admin/orders?" + query, "GET", undefined, controller.signal).then(
      (response) => {
        if (!controller.signal.aborted) setData({ key: query, entries: response.data, totalPages: response.pagination?.totalPages ?? 0 });
      },
      (failure: unknown) => { if (!controller.signal.aborted) setError(errorMessage(failure)); },
    );
    return () => controller.abort();
  }, [query, version]);

  const open = async (order: Order) => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try { setDetail((await request<Order>("/admin/orders/" + order._id)).data); }
    catch (failure) { setError(errorMessage(failure)); }
    finally { pending.current = false; setBusy(false); }
  };

  const advance = async (order: Order, status: string) => {
    if (pending.current) return;
    const cashReceived = order.paymentMethod === "cod" && order.paymentStatus === "pending" && status === "delivered";
    if (cashReceived && !window.confirm("Confirm the order was delivered and the full cash payment was received?")) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      await request("/admin/orders/" + order._id + "/fulfillment", "PATCH", { status, ...(cashReceived ? { cashReceived: true } : {}) });
      setDetail({ ...order, orderStatus: status, paymentStatus: cashReceived ? "paid" : order.paymentStatus });
      setVersion((value) => value + 1);
    } catch (failure) { setError(errorMessage(failure)); }
    finally { pending.current = false; setBusy(false); }
  };

  const current = data?.key === query ? data : undefined;
  return <section className="admin-page">
    <h1 className="admin-heading">Orders</h1>
    <form key={status + id} className="flex flex-wrap items-end gap-3 admin-panel" onSubmit={(event) => {
      event.preventDefault();
      setError("");
      setDetail(undefined);
      const fields = new FormData(event.currentTarget);
      const next = new URLSearchParams();
      for (const [name, value] of fields) if (String(value).trim()) next.set(name, String(value).trim());
      setParams(next);
    }}>
      <label className="grid gap-1 text-sm font-semibold">Order status<select name="status" defaultValue={status} className="rounded-lg border border-border p-2">
        <option value="">All statuses</option>{statusOptions.map((item) => <option key={item} value={item}>{label(item)}</option>)}
      </select></label>
      <label className="grid gap-1 text-sm font-semibold">Order ID<input name="orderId" defaultValue={id} pattern="[a-fA-F0-9]{24}" className="rounded-lg border border-border p-2" /></label>
      <button className="rounded-lg bg-primary px-4 py-2 text-white">Filter</button>
    </form>
    {error && <p role="alert" className="text-error">{error}</p>}
    {!current && !error && <p role="status">Loading orders...</p>}
    {current?.entries.length === 0 && <p>No matching orders.</p>}
    <ul className="grid gap-3">
      {current?.entries.map((item) => <li key={item._id} className="flex flex-wrap items-center justify-between gap-3 admin-panel text-sm">
        <div><p className="break-all font-semibold">{item._id}</p><div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold capitalize"><span className="rounded-full bg-surface px-2 py-1">{label(item.orderStatus)}</span><span className="rounded-full bg-surface px-2 py-1">Payment · {label(item.paymentStatus)}</span></div></div>
        <p className="font-semibold">{currency.format(item.totalAmount)}</p>
        <button type="button" disabled={busy} onClick={() => void open(item)} className="font-semibold text-primary">View order</button>
      </li>)}
    </ul>
    {(current?.totalPages ?? 0) > 1 && <nav className="flex gap-4 text-sm" aria-label="Orders pagination">
      <button type="button" disabled={page <= 1} onClick={() => setParams({ ...Object.fromEntries(params), page: String(page - 1) })}>Previous</button>
      <span>Page {page} of {current?.totalPages}</span>
      <button type="button" disabled={page >= (current?.totalPages ?? 0)} onClick={() => setParams({ ...Object.fromEntries(params), page: String(page + 1) })}>Next</button>
    </nav>}
    {detail && <section className="space-y-3 admin-panel">
      <div className="flex justify-between gap-3"><h2 className="break-all font-bold">Order {detail._id}</h2><button type="button" disabled={busy} onClick={() => setDetail(undefined)}>Close</button></div>
      <p className="capitalize">{label(detail.orderStatus)} · Payment {label(detail.paymentStatus)}</p>
      {detail.paymentMethod === "cod" && <p className="text-sm text-muted">Cash on Delivery</p>}
      <p>{detail.shippingAddress?.fullName} · {detail.shippingAddress?.addressLine1} · {detail.shippingAddress?.city}</p>
      {detail.items?.map((item) => <p key={item._id} className="text-sm">{item.product?.name ?? "Unavailable product"} · {item.varient?.sku} · Quantity {item.quantity}</p>)}
      {(detail.paymentStatus === "paid" || (detail.paymentMethod === "cod" && detail.paymentStatus === "pending")) && nextStatus[detail.orderStatus] && <button type="button" disabled={busy}
        onClick={() => void advance(detail, nextStatus[detail.orderStatus])} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">
        {detail.paymentMethod === "cod" && detail.paymentStatus === "pending" && nextStatus[detail.orderStatus] === "delivered"
          ? "Mark delivered and record cash" : `Mark ${nextStatus[detail.orderStatus]}`}
      </button>}
    </section>}
  </section>;
}
