import { lazy, Suspense } from "react";
import { Link, Route, Routes } from "react-router-dom";
import AdminSession from "../AdminSession";
import MainLayout from "../layouts/MainLayout";

const Dashboard = lazy(() => import("../pages/DashBoard"));
const Products = lazy(() => import("../pages/Products"));
const Categories = lazy(() => import("../pages/Categories"));
const Brands = lazy(() => import("../pages/Brands"));
const Orders = lazy(() => import("../pages/Orders"));
const Inventory = lazy(() => import("../pages/Inventory"));
const Settings = lazy(() => import("../pages/Settings"));
const Variants = lazy(() => import("../pages/Variants"));
const ProductImages = lazy(() => import("../pages/ProductImages"));

export default function AppRoutes() {
  return <AdminSession>
    <Suspense fallback={<p role="status" className="p-6 text-muted">Loading workspace...</p>}>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:productId/variants" element={<Variants />} />
          <Route path="products/:productId/images" element={<ProductImages />} />
          <Route path="categories" element={<Categories />} />
          <Route path="brands" element={<Brands />} />
          <Route path="orders" element={<Orders />} />
          <Route path="settings" element={<Settings />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="*" element={<div className="admin-panel space-y-3"><h1 className="admin-heading">Page not found</h1><Link className="text-primary" to="/">Return to dashboard</Link></div>} />
        </Route>
      </Routes>
    </Suspense>
  </AdminSession>;
}
