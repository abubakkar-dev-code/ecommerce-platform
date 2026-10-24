import { useState } from "react";
import { CiLogout } from "react-icons/ci";
import { FaBoxOpen, FaShoppingCart } from "react-icons/fa";
import { IoIosLogOut, IoMdSettings } from "react-icons/io";
import {
  MdDashboard,
  MdOutlineInventory,
  MdOutlineLogout,
} from "react-icons/md";
import { TbBrandAdobe, TbCategoryFilled } from "react-icons/tb";
import { Link, NavLink } from "react-router-dom";

const Sidebar = ({ isDrawerOpen, setIsDrawerOpen }) => {
  const navLinks = [
    {
      id: 1,
      name: "Dashboard",
      path: "/",
      icon: <MdDashboard />,
    },
    {
      id: 2,
      name: "Products",
      path: "/products",
      icon: <FaBoxOpen />,
    },
    {
      id: 3,
      name: "Categories",
      path: "/categories",
      icon: <TbCategoryFilled />,
    },
    {
      id: 4,
      name: "Brands",
      path: "/brands",
      icon: <TbBrandAdobe />,
    },
    {
      id: 5,
      name: "Orders",
      path: "/orders",
      icon: <FaShoppingCart />,
    },
    {
      id: 6,
      name: "Settings",
      path: "/settings",
      icon: <IoMdSettings />,
    },
    {
      id: 7,
      name: "Inventory",
      path: "/inventory",
      icon: <MdOutlineInventory />,
    },
    {
      id: 8,
      name: "Logout",
      path: "/logout",
      icon: <MdOutlineLogout />,
    },
  ];
  return (
    <div>
      <h1 className="text-2xl font-bold">{isDrawerOpen ? "Nexora" : "N"}</h1>
      <div className={`flex flex-col gap-10 mt-10`}>
        {isDrawerOpen&&<p>Main Menu</p>}
        {navLinks.map((link) => (
          <div>
            <NavLink
              to={link.path}
              key={link.id}
              className={({ isActive }) =>
                `flex items-center gap-6 ${isActive ? "text-blue-600" : "text-black"}`
              }
            >
              {isDrawerOpen ? (
                <>
                  <span className="flex justify-center items-center gap-5">
                    <span className="text-xl">{link.icon}</span>
                    {link.name}
                  </span>
                </>
              ) : (
                <span className="text-xl mt-3">{link.icon}</span>
              )}
            </NavLink>
          </div>
        ))}
        <p
          className="flex justify-end"
          onClick={() => setIsDrawerOpen((prev) => !prev)}
        >
          {isDrawerOpen ? (
            <CiLogout className="text-3xl font-bold" />
          ) : (
            <IoIosLogOut className="text-3xl font-bold" />
          )}
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
