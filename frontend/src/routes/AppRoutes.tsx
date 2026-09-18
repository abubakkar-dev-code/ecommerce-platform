import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";
import GoogleSuccess from "../pages/auth/GoogleSuccess.page";
import StoreLayout from "../components/layout/StoreLayout";
import Home from "../pages/home/Home";
import Products from "../pages/products/Products";
import ProductDetails from "../pages/products/ProductDetails";
import Cart from "../pages/cart/Cart";
import CheckoutPage from "../pages/checkout/CheckoutPage";
import Orders from "../pages/orders/Order";
import OrderDetails from "../pages/orders/OrderDetails";
import Profile from "../pages/profile/Profile";
import Whishlist from "../pages/whishlist/WhishList";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/google-success" element={<GoogleSuccess />} />

        {/* store pages */}
        <Route element={<StoreLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:productId" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:orderId" element={<OrderDetails />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/wishlist" element={<Whishlist />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
