import { lazy, Suspense } from "react";
import { Link, Routes, Route } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import MainLayout from "../layouts/MainLayout";
import Home from "../pages/home/Home";
import RequireAuth from "../componenets/auth/RequireAuth";

const Register = lazy(() => import("../pages/auth/Register"));
const Login = lazy(() => import("../pages/auth/Login"));
const VerifyEmail = lazy(() => import("../pages/auth/VerifyEmail"));
const ForgotPassword = lazy(() => import("../pages/auth/PasswordRecovery").then((module) => ({ default: module.ForgotPassword })));
const ResetPassword = lazy(() => import("../pages/auth/PasswordRecovery").then((module) => ({ default: module.ResetPassword })));
const Products = lazy(() => import("../pages/products/Products"));
const ProductDetails = lazy(() => import("../pages/products/ProductDetails"));
const Cart = lazy(() => import("../pages/cart/Cart"));
const Checkout = lazy(() => import("../pages/checkout/Checkout"));
const Wishlist = lazy(() => import("../pages/wishList/wishList"));
const Orders = lazy(() => import("../pages/orders/Orders").then((module) => ({ default: module.Orders })));
const OrderDetails = lazy(() => import("../pages/orders/OrderDetails"));
const Profile = lazy(() => import("../pages/profile/Profile"));

export default function AppRoutes() {
  return (
    <Suspense fallback={<p role="status" className="mx-auto max-w-7xl p-6 text-muted">Loading page...</p>}>
      <Routes>
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
        </Route>
        <Route element={<AuthLayout />}>
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
        </Route>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:productId" element={<ProductDetails />} />
          <Route element={<RequireAuth />}>
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="wishList" element={<Wishlist />} />
            <Route path="orders" element={<Orders />} />
            <Route path="order-details/:orderId" element={<OrderDetails />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<section className="mx-auto max-w-7xl space-y-3 p-6">
            <h1 className="text-3xl font-bold">Page not found</h1>
            <Link to="/" className="font-semibold text-primary">Return to the store</Link>
          </section>} />
        </Route>
      </Routes>
    </Suspense>
  );
}
