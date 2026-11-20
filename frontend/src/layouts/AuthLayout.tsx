import { Link, Outlet } from "react-router-dom";
import { FiArrowUpRight, FiBox } from "react-icons/fi";

export default function AuthLayout() {
  return <main className="mx-auto grid min-h-dvh w-full max-w-[90rem] grid-rows-[auto_1fr] gap-4 p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:grid-rows-[1fr] md:p-5">
    <aside className="relative isolate flex min-h-32 min-w-0 flex-col justify-between gap-8 overflow-hidden rounded-3xl bg-[#211732] p-5 text-white sm:p-8 md:min-h-[36rem] md:p-10">
      <img src="/auth-tech-studio.webp" alt="" className="absolute inset-0 -z-20 h-full w-full object-cover object-[center_46%]" decoding="async" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-b from-[#211732]/80 via-transparent to-[#211732]/85" />
      <Link to="/" className="flex w-fit items-center gap-2 text-xl font-extrabold tracking-tight focus-visible:outline-white">
        <span className="rounded-xl bg-[#d8ccff] p-2 text-[#211732]"><FiBox aria-hidden="true" /></span>Nexora
      </Link>
      <Link to="/products" className="flex min-h-10 w-fit items-center gap-2 rounded-full border border-white/30 bg-[#211732]/80 px-4 text-sm font-semibold text-white hover:bg-[#211732] focus-visible:outline-white">
        Browse the store <FiArrowUpRight aria-hidden="true" />
      </Link>
    </aside>
    <div className="grid min-w-0 content-center"><Outlet /></div>
  </main>;
}
