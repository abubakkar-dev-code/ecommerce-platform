import { useState } from "react";

const Category = () => {
  const [selectedCategory, setSelectedCategory] = useState("Mobiles");

  const categories = [
    "Mobiles",
    "Laptops",
    "Headphones",
    "TV & Home Appliances",
    "Smart Watches",
    "Cameras",
    "Gaming",
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 sm:gap-4">
        {categories.map((category) => {
          const isSelected = selectedCategory === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`flex flex-col items-center justify-center p-4 sm:py-6 sm:px-3 rounded-2xl border bg-white transition-all duration-200 cursor-pointer min-h-[130px] hover:shadow-sm ${
                isSelected
                  ? "border-blue-500 ring-1 ring-blue-500/20"
                  : "border-gray-200 hover:border-blue-400"
              }`}
            >
              <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-blue-50/80 mb-3">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-gray-800 text-center leading-tight">
                {category}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Category;

