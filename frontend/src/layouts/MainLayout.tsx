import { Outlet } from "react-router-dom";
import Navbar from "../componenets/header/Navbar";
import Footer from "../componenets/footer/Footer";

export default function MainLayout() {
  return <div className="flex min-h-dvh flex-col">
    <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-30 focus:rounded-lg focus:bg-white focus:p-3">Skip to main content</a>
    <Navbar />
    <main id="main-content" className="min-w-0 flex-1" tabIndex={-1}><Outlet /></main>
    <Footer />
  </div>;
}
