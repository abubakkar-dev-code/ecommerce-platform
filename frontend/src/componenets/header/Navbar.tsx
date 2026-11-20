import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../redux/store";
import { clearCredentials } from "../../redux/slices/authSlice";
import authService from "../../services/authService";
import cartService from "../../services/cartService";
import productService, { type CatalogOption } from "../../services/productService";
import toast from "react-hot-toast";
import { FiBox, FiMenu, FiSearch, FiShoppingBag, FiUser } from "react-icons/fi";
import Drawer from "../UI/Drawer";

export default function Navbar() {
  const userId = useSelector((state: RootState) => state.userInfo.users?._id);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [loggingOut, setLoggingOut] = useState(false);
  const [categories, setCategories] = useState<CatalogOption[]>([]);
  const [badge, setBadge] = useState<{ userId: string; count: number }>();
  const count = badge?.userId === userId ? badge?.count : undefined;

  useEffect(() => {
    let active = true;
    productService.getCategories().then(
      (data) => { if (active) setCategories(data.filter((item) => !item.parentCategory)); },
      () => undefined,
    );
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!userId) return;
    let controller: AbortController | undefined;
    const refresh = () => {
      controller?.abort();
      const request = new AbortController();
      controller = request;
      cartService.getCount(request.signal).then(
        (count) => { if (!request.signal.aborted) setBadge({ userId, count }); },
        () => { if (!request.signal.aborted) setBadge(undefined); },
      );
    };
    refresh();
    window.addEventListener("cart-updated", refresh);
    return () => {
      controller?.abort();
      window.removeEventListener("cart-updated", refresh);
    };
  }, [userId]);

  const logout = async () => {
    setLoggingOut(true);
    try {
      await authService.logout();
      dispatch(clearCredentials());
      navigate("/auth/login");
    } catch {
      toast.error("Could not log out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  };

  const search = new URLSearchParams(location.search).get("search") ?? "";
  return (
    <header className="relative z-30 border-b border-border bg-white lg:sticky lg:top-0">
      <nav aria-label="Main navigation" className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-4 px-4 py-4 text-sm sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight"><span className="rounded-xl bg-primary p-2 text-white"><FiBox aria-hidden="true" /></span>Nexora</Link>
        <div className="ml-auto md:hidden"><Drawer closeAt={768} title="Store menu" label={<FiMenu aria-hidden="true" />}>
          <nav className="grid gap-2 text-sm font-semibold" aria-label="Mobile navigation">
            <Link className="store-secondary justify-start" to="/products">All products</Link>
            {categories.map((item) => <Link className="store-secondary justify-start" key={item._id} to={`/products?category=${item._id}`}>{item.name}</Link>)}
            {userId ? <><Link className="store-secondary justify-start" to="/profile">Profile</Link><Link className="store-secondary justify-start" to="/orders">My orders</Link><Link className="store-secondary justify-start" to="/wishlist">Wishlist</Link><button type="button" disabled={loggingOut} onClick={() => void logout()} className="store-secondary justify-start text-error">Log out</button></> : <><Link className="store-secondary justify-start" to="/auth/login">Sign in</Link><Link className="store-secondary justify-start" to="/auth/register">Create account</Link></>}
          </nav>
        </Drawer></div>
        <form key={search} role="search" className="order-last flex w-full min-w-0 gap-2 md:order-0 md:w-auto md:flex-1"
          onSubmit={(event) => {
            event.preventDefault();
            const term = String(new FormData(event.currentTarget).get("search") ?? "").trim();
            navigate(term ? `/products?${new URLSearchParams({ search: term })}` : "/products");
          }}>
          <input type="search" name="search" aria-label="Search products" placeholder="Search products" maxLength={100} defaultValue={search}
            className="store-input flex-1 bg-surface" />
          <button className="store-button" aria-label="Search catalog"><FiSearch aria-hidden="true" /><span className="hidden sm:inline">Search</span></button>
        </form>
        {userId ? (
          <div className="flex items-center gap-2 font-semibold md:ml-auto">
            <Link to="/cart" className="store-secondary" aria-label={count ? `Cart, ${count} items` : "Cart"}><FiShoppingBag aria-hidden="true" />{count ? <span className="rounded-full bg-surface px-2 text-xs">{count}</span> : null}</Link>
            <details className="relative hidden md:block">
              <summary className="store-secondary list-none"><FiUser aria-hidden="true" />Account</summary>
              <div className="absolute right-0 z-20 mt-2 grid w-36 gap-3 rounded-lg border border-border bg-white p-4 shadow-sm">
                <Link to="/profile">Profile</Link>
                <Link to="/orders">Orders</Link>
                <Link to="/wishList">Wishlist</Link>
                <button type="button" disabled={loggingOut} onClick={() => void logout()} className="text-left text-error">Log out</button>
              </div>
            </details>
          </div>
        ) : (
          <div className="ml-auto hidden items-center gap-3 font-semibold md:flex">
            <Link to="/auth/login">Login</Link>
            <Link to="/auth/register" className="rounded-lg border border-border px-3 py-2 hover:border-primary">Register</Link>
          </div>
        )}
      </nav>
      <nav aria-label="Shop by category" className="mx-auto hidden max-w-7xl gap-x-6 overflow-x-auto whitespace-nowrap px-6 pb-4 text-sm md:flex lg:px-8">
          <Link to="/products" className="font-semibold text-primary">All products</Link>
          {categories.map((item) => <Link key={item._id} to={`/products?category=${item._id}`} className="font-medium text-muted hover:text-primary">{item.name}</Link>)}
      </nav>
    </header>
  );
}
