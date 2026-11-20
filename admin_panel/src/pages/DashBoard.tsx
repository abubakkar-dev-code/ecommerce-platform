import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { errorMessage, request } from "../adminApi";

type Metrics = { products: number; activeProducts: number; orders: number; pendingOrders: number; lowStockVariants: number; paidOrderTotal: number };
const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

export default function Dashboard() {
  const [metrics, setMetrics] = useState<Metrics>();
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    request<Metrics>("/admin/dashboard", "GET", undefined, controller.signal).then(
      ({ data }) => { if (!controller.signal.aborted) setMetrics(data); },
      (failure: unknown) => { if (!controller.signal.aborted) setError(errorMessage(failure)); },
    );
    return () => controller.abort();
  }, []);

  return <section className="admin-page">
    <h1 className="admin-heading">Dashboard</h1>
    {error && <p role="alert" className="text-error">{error}</p>}
    {!metrics && !error && <p role="status">Loading store metrics...</p>}
    {metrics && <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[
        ["Products", metrics.products], ["Active products", metrics.activeProducts], ["Orders", metrics.orders],
        ["Pending orders", metrics.pendingOrders], ["Low-stock variants", metrics.lowStockVariants],
        ["Qualifying paid order total", currency.format(metrics.paidOrderTotal)],
      ].map(([label, value]) => <div key={label} className="admin-panel">
        <dt className="text-sm text-muted">{label}</dt><dd className="mt-2 text-2xl font-bold">{value}</dd>
      </div>)}
    </dl>}
    <nav aria-label="Dashboard shortcuts" className="flex flex-wrap gap-4 text-sm font-semibold text-primary">
      <Link to="/products">Products</Link><Link to="/inventory">Inventory</Link><Link to="/orders">Orders</Link>
    </nav>
  </section>;
}
