import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { useState } from "react";
import { logout } from "../../redux/slices/auth.slice";

const Header = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    localStorage.removeItem("token");
    dispatch(logout());
    navigate("/");
  };

  return (
    <header className="flex items-center justify-between border-b border-border bg-surface px-8 py-4">
      {/* Logo */}
      <Link to="/" className="text-xl font-bold text-primary">
        MyStore
      </Link>

      {/* Navigation */}
      <nav className="flex items-center gap-6">
        <Link to="/" className="font-medium text-text hover:text-primary">
          Home
        </Link>

        <Link
          to="/products"
          className="font-medium text-text hover:text-primary"
        >
          Products
        </Link>
      </nav>
      {/* search bar */}
      <div className="flex items-center">
        <input
          type="text"
          placeholder="Search products..."
          className="w-64 rounded-l-md border border-border bg-surface px-4 py-2 text-sm text-text outline-none focus:border-primary"
        />

        <button
          type="button"
          className="rounded-r-md bg-primary px-4 py-2 text-white hover:bg-primary-hover"
        >
          Search
        </button>
      </div>
      {/* User */}
      {isAuthenticated ? (
        <div>
          <p className="text-sm font-medium text-text">
            Welcome, {user?.name}!
          </p>
          <div className="flex items-center gap-4">
            <Link
              to="/wishlist"
              className="font-medium text-text hover:text-primary"
            >
              Wishlist
            </Link>

            <Link
              to="/cart"
              className="font-medium text-text hover:text-primary"
            >
              Cart
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="font-medium text-text hover:text-primary"
              >
                Profile ▼
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-36 rounded-md border border-border bg-surface py-2 shadow-md">
                  <Link
                    to="/profile"
                    onClick={() => setIsProfileOpen(false)}
                    className="block px-4 py-2 text-sm text-text hover:bg-background"
                  >
                    Profile
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="block w-full px-4 py-2 text-left text-sm text-error hover:bg-background"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="font-medium text-text hover:text-primary"
          >
            Login
          </Link>

          <Link
            to="/register"
            className="rounded-md bg-primary px-4 py-2 font-medium text-white hover:bg-primary-hover"
          >
            Register
          </Link>
        </div>
      )}
    </header>
  );
};
export default Header;
