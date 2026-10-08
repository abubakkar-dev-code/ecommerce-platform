import { Outlet } from "react-router-dom";
import Navbar from "../componenets/header/Navbar";
import Footer from "../componenets/footer/Footer"



const MainLayout = () => {
  return (
    <>
      <header>
        <Navbar />
      </header>
      <main>
        <Outlet />
      </main>
      <footer>
        <Footer />
      </footer>
    </>
  );
};
export default MainLayout;
