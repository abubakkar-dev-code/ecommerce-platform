import { Routes, Route } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import Register from "../pages/auth/Register";
import Login from "../pages/auth/Login";
import MainLayout from "../layouts/MainLayout";
import Home from "../pages/home/Home";
import Products from "../pages/products/Products";
import Cart from "../pages/cart/Cart";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
      </Route>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/cart" element={<Cart />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
