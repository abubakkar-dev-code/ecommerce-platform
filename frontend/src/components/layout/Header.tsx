import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { useState } from "react";
import { logout } from "../../redux/slices/auth.slice";
import { Menu, X } from "lucide-react";

const Header = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    localStorage.removeItem("token");
    dispatch(logout());
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
    navigate("/");
  };

  return (
    <header className="border-b border-border bg-surface">
      {/* Main Header */}
      <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          to="/"
          className="text-xl font-bold text-primary"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          MyStore
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
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

        {/* Search */}
        <div className="hidden items-center md:flex">
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

        {/* Desktop User Section */}
        {isAuthenticated ? (
          <div className="hidden md:block">
            <p className="text-sm font-medium text-text">
              Welcome, {user?.name}!
            </p>

            <div className="flex items-center justify-end gap-4">
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
          <div className="hidden items-center gap-4 md:flex">
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

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="rounded-md p-2 text-text hover:bg-background md:hidden"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="border-t border-border bg-surface md:hidden">
          <nav className="flex flex-col px-4 py-4 sm:px-6">
            {/* Search */}
            <div className="mb-4 flex">
              <input
                type="text"
                placeholder="Search products..."
                className="min-w-0 flex-1 rounded-l-md border border-border bg-surface px-4 py-2 text-sm text-text outline-none focus:border-primary"
              />

              <button
                type="button"
                className="rounded-r-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary-hover"
              >
                Search
              </button>
            </div>

            {/* Navigation */}
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="rounded-md px-3 py-3 font-medium text-text hover:bg-background hover:text-primary"
            >
              Home
            </Link>

            <Link
              to="/products"
              onClick={() => setIsMobileMenuOpen(false)}
              className="rounded-md px-3 py-3 font-medium text-text hover:bg-background hover:text-primary"
            >
              Products
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to="/wishlist"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-md px-3 py-3 font-medium text-text hover:bg-background hover:text-primary"
                >
                  Wishlist
                </Link>

                <Link
                  to="/cart"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-md px-3 py-3 font-medium text-text hover:bg-background hover:text-primary"
                >
                  Cart
                </Link>

                <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-md px-3 py-3 font-medium text-text hover:bg-background hover:text-primary"
                >
                  Profile
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-md px-3 py-3 text-left font-medium text-error hover:bg-background"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-md px-3 py-3 font-medium text-text hover:bg-background hover:text-primary"
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="mt-2 rounded-md bg-primary px-4 py-3 text-center font-medium text-white hover:bg-primary-hover"
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
