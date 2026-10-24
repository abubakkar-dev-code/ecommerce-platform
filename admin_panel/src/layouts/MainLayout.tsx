import { Outlet } from "react-router-dom";
import Sidebar from "../componenets/sidebar/Sidebar";
import Navbar from "../componenets/header/Navbar";
import { useState } from "react";

const MainLayout = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  return (
    <>
      <div className="flex gap-4 bg-background min-h-screen ">
        <aside
          className={`hidden shrink-0 transition-all duration-300 ${isDrawerOpen ? "w-64" : "w-16"} border-r borer-border rounded-tr-2xl shadow-xl border-gray-200 py-8 px-4 md:block`}
        >
          <Sidebar
            isDrawerOpen={isDrawerOpen}
            setIsDrawerOpen={setIsDrawerOpen}
          />
        </aside>
        <div className="flex flex-1 min-w-0  flex-col  h-screen border-l border-gray-200 shadow-xl rounded-tl-2xl">
          <header className="border-b border-gray-300 py-4 px-4 ">
            <Navbar />
          </header>
          <main className="py-8 px-5">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
};

export default MainLayout;
