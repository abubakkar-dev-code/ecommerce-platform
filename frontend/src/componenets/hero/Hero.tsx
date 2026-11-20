import { Link } from "react-router-dom";
import { FiArrowUpRight } from "react-icons/fi";
import type { Product } from "../../redux/slices/productSlice";
import CatalogImage from "../products/CatalogImage";

export default function Hero({ featured }: { featured?: Product }) {
  const image = featured?.images?.[0];
  const source = image?.primaryImage || image?.thumbnails?.[0]?.url;
  return <section className="overflow-hidden rounded-[2rem] bg-[#211732] text-white">
    <div className="grid items-center gap-5 p-6 sm:p-10 md:grid-cols-[1.1fr_1fr] lg:gap-14 lg:p-14">
      <div className="py-3">
        <h1 className="max-w-xl text-4xl leading-[1.03] font-extrabold tracking-tight sm:text-5xl lg:text-6xl">Find your next tech upgrade</h1>
        <p className="mt-5 max-w-sm text-pretty text-base leading-relaxed text-violet-100">Explore the catalog, compare variants, and find the right fit.</p>
        <Link to="/products" className="mt-7 inline-flex min-h-11 items-center gap-3 rounded-xl bg-[#d8ccff] px-5 py-3 text-sm font-bold text-[#211732] hover:bg-white">
          Shop the catalog <FiArrowUpRight aria-hidden="true" />
        </Link>
      </div>
      {featured && source ? <Link to={`/products/${featured._id}`}
        className="group grid min-w-0 overflow-hidden rounded-3xl border border-white/15 bg-[#332449]">
        <CatalogImage eager src={source} alt={featured.name} className="aspect-[4/3] w-full bg-white object-contain p-5 sm:p-8" />
        <div className="flex items-center justify-between gap-4 px-5 py-4 text-sm font-semibold">
          <span className="min-w-0 break-words">{featured.name}</span><FiArrowUpRight className="shrink-0" aria-hidden="true" />
        </div>
      </Link> : <Link to="/products?sort=newest" className="flex aspect-[4/3] min-h-24 items-center justify-between gap-4 rounded-3xl border border-white/15 bg-[#332449] p-6 font-semibold">
        Browse new arrivals <FiArrowUpRight aria-hidden="true" />
      </Link>}
    </div>
  </section>;
}
