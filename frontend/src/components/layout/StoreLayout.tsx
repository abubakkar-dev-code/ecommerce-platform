import Footer from "./Footer";
import Header from "./Header";
import { Outlet } from "react-router-dom";

const StoreLayout = () => {
  return (
    <div>
      <Header />
      <Outlet />
      <Footer/>
    </div>
  );
};

export default StoreLayout;
