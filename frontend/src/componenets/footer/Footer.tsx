import { Link } from "react-router-dom";
import { FiBox } from "react-icons/fi";

export default function Footer() {
  return <footer className="mt-12 bg-[#211732] text-white">
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-[1fr_auto] sm:px-6 lg:px-8">
      <Link to="/" className="flex w-fit items-center gap-2 self-start text-xl font-extrabold tracking-tight">
        <span className="rounded-xl bg-[#d8ccff] p-2 text-[#211732]"><FiBox aria-hidden="true" /></span>Nexora
      </Link>
      <nav aria-label="Footer navigation" className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm font-medium text-violet-100 sm:gap-x-12">
        <Link className="hover:text-white hover:underline" to="/products">Browse products</Link>
        <Link className="hover:text-white hover:underline" to="/cart">Shopping cart</Link>
        <Link className="hover:text-white hover:underline" to="/wishlist">Wishlist</Link>
        <Link className="hover:text-white hover:underline" to="/orders">My orders</Link>
      </nav>
    </div>
  </footer>;
}
