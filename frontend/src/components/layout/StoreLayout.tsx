import Header from "./Header";
import { Outlet } from "react-router-dom";

const StoreLayout = () => {
  return (
    <div>
      <Header />
      <Outlet />
    </div>
  );
};

export default StoreLayout;
