import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import accountService, { type Order } from "../../services/accountService";
import apiError from "../../services/apiError";
import OrderStatus from "../../componenets/UI/OrderStatus";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

export function Orders() {
  const [orders, setOrders] = useState<Order[]>();
  const [error, setError] = useState("");
  useEffect(() => {
    const request = new AbortController();
    accountService.getOrders(request.signal).then(
      (data) => { if (!request.signal.aborted) setOrders(data.toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))); },
      (failure: unknown) => { if (!request.signal.aborted) setError(apiError(failure, "Could not load orders.")); },
    );
    return () => request.abort();
  }, []);

  return (
    <section className="store-page space-y-5">
      <h1 className="store-title">Your orders</h1>
      {error ? <p role="alert">{error}</p> : !orders ? <p role="status">Loading orders...</p>
         : !orders.length ? <p className="store-empty">You have no orders yet. <Link to="/products" className="text-primary hover:underline">Browse products</Link></p>
        : <ul className="grid gap-4">
          {orders.map((order) => <li key={order._id}>
            <Link to={`/order-details/${order._id}`} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-white p-4 hover:border-primary sm:p-6">
              <div>
                <p className="font-semibold">Order {order._id.slice(-8).toUpperCase()}</p>
                <p className="text-sm text-muted">{new Date(order.createdAt).toLocaleDateString("en-IN")}</p>
              </div>
              <div className="flex flex-wrap gap-2"><OrderStatus status={order.orderStatus} /><OrderStatus status={order.paymentStatus} label="Payment" /></div>
              <p className="font-semibold">{currency.format(order.totalAmount)}</p>
            </Link>
          </li>)}
        </ul>}
    </section>
  );
}
