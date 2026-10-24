import { Route, Routes } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import DashBoard from "../pages/DashBoard";
import Products from "../pages/Products";
import Categories from "../pages/Categories";
import Brands from "../pages/Brands";
import Orders from "../pages/Orders";
import Inventory from "../pages/Inventory";
import Settings from "../pages/Settings";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<DashBoard />} />
        <Route path="products" element={<Products />} />
        <Route path="categories" element={<Categories />} />
        <Route path="brands" element={<Brands />} />
        <Route path="orders" element={<Orders />} />
        <Route path="settings" element={<Settings />} />
        <Route path="Inventory" element={<Inventory />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
