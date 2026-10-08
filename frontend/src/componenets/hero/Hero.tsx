import Button from "../UI/Button";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <div className="w-full bg-linear-to-r from-blue-50 to-indigo-50/60 rounded-3xl flex flex-col md:flex-row items-center overflow-hidden border border-blue-100/80 shadow-sm">
      <div className="flex-1 p-8 sm:p-12 lg:p-16">
        <span className="inline-block font-extrabold text-primary text-xs uppercase tracking-wider bg-blue-100/70 px-3 py-1 rounded-full mb-3">
          NEW ARRIVALS
        </span>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight mt-2">
          Upgrade Your Tech Lifestyle
        </h1>
        <p className="text-gray-600 font-normal mt-4 text-base max-w-lg leading-relaxed">
          Discover the latest gadgets, high-performance laptops, smartphones and
          premium audio at unbeatable prices.
        </p>
        <div className="mt-8">
          <Link to="/products">
            <Button>Shop Now &rarr;</Button>
          </Link>
        </div>
      </div>
      <div className="flex-1 p-6 sm:p-10 flex items-center justify-center w-full">
        <div className="w-full max-w-md aspect-4/3 rounded-2xl bg-white/80 backdrop-blur-sm border border-blue-100 shadow-md p-6 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center text-3xl mb-4">
            ⚡
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            Exclusive Tech Deals
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Up to 40% off on premium flagship devices
          </p>
        </div>
      </div>
    </div>
  );
};

export default Hero;
