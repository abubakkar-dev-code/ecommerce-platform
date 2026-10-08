import { Link } from "react-router-dom";
import Button from "../UI/Button";
import { useState } from "react";
import { CgProfile } from "react-icons/cg";

const Navbar = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  console.log(isProfileOpen);

  return (
    <div>
      <nav className="flex w-full justify-between py-5 px-10 border-b border-gray-300 items-center">
        <div>
          <p className="text-xl font-extrabold text-primary">Nexora</p>
        </div>
        <ul className="flex gap-8">
          <li>
            <Link to="/" className="font-semibold hover:text-primary-hover">
              Home
            </Link>
          </li>
          <li>
            <Link
              to="/Products"
              className="text-hover-primary font-semibold hover:text-primary-hover"
            >
              Products
            </Link>
          </li>
        </ul>
        <div>
          <input
            type="search"
            placeholder="search products..."
            className="py-2 px-2 w-70  focus:outline-blue-800 border border-gray-300 rounded-l-lg"
          />
          <button className="py-3 px-6 bg-primary text-white rounded-r-lg border-none">
            Search
          </button>
        </div>
        {isLogin ? (
          <div className="flex gap-4 items-center relativer">
            <Link to="/wishList">
              {" "}
              <button className="font-bold">WishList</button>
            </Link>
            <Link to="/cart">
              {" "}
              <button className="font-bold py-3 px-8 bg-primary text-white rounded-md">
                Cart
              </button>
            </Link>
            <button onClick={() => setIsProfileOpen(!isProfileOpen)}>
              <CgProfile size={35} />
            </button>
            {isProfileOpen && (
              <div className="absolute right-2 bg-white top-22 border border-gray-500 w-32 flex flex-col rounded-lg mt-2">
                <Link to="/profile">
                  <button className="font-bold block hover:bg-gray-100 text-center py-2 w-full">Profile</button>
                </Link>
                <Link to="/orders">
                  <button className="font-bold block hover:bg-gray-100 text-center py-2 w-full">Orders</button>
                </Link>
                <Link to="/">
                  <button onClick={() => setIsLogin(!isLogin)} className="font-bold block hover:bg-gray-100 text-center py-2 w-full text-red-500">Login</button>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="flex gap-2">
            <button className="font-bold">Login</button>
            <Button>Register</Button>
          </div>
        )}
      </nav>
    </div>
  );
};

export default Navbar;
