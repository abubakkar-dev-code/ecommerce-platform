import { Link, } from "react-router-dom";
import Button from "../UI/Button";
import { useState } from "react";

const Navbar = () => {
  const [isLogin, setIsLogin] = useState(true);
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
          <div className="flex gap-4">
            <button className="font-bold">WishList</button>
            <Link to="/cart">
              {" "}
              <button className="font-bold py-3 px-8 bg-primary text-white rounded-md">
                Cart
              </button>
            </Link>
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
