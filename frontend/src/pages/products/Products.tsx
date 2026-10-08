import Pagination from "../../componenets/products/Pagination";
import ProductCard from "../../componenets/products/ProductCard";

const Products = () => {
  const categories = [
    { type: "checkbox", label: "Mobiles" },
    { type: "checkbox", label: "Laptops" },
    { type: "checkbox", label: "Headphones" },
    { type: "checkbox", label: "Cameras" },
    { type: "checkbox", label: "Smart Watches" },
  ];
  const brands = [
    { type: "checkbox", label: "Apple" },
    { type: "checkbox", label: "Samsung" },
    { type: "checkbox", label: "Sony" },
    { type: "checkbox", label: "Boat" },
    { type: "checkbox", label: "Canon" },
  ];
  const filters = [
    "Newest",
    "Oldest",
    "Price:Low to High",
    "Price:High to Low",
  ];
  const featuredProducts = [
    {
      id: 1,
      name: "iPhone 15",
      image: "https://placehold.co/400x400/e2e8f0/64748b?text=iPhone+15",
      rating: 4.5,
      reviews: 120,
      price: 79900,
      originalPrice: 89000,
    },
    {
      id: 2,
      name: "Samsung Galaxy S24",
      image: "https://placehold.co/400x400/e2e8f0/64748b?text=Galaxy+S24",
      rating: 4.4,
      reviews: 98,
      price: 64999,
      originalPrice: 74999,
    },
    {
      id: 3,
      name: "MacBook Air M2",
      image: "https://placehold.co/400x400/e2e8f0/64748b?text=MacBook+Air",
      rating: 4.7,
      reviews: 200,
      price: 89900,
      originalPrice: 99900,
    },
    {
      id: 4,
      name: "Sony Headphones",
      image: "https://placehold.co/400x400/e2e8f0/64748b?text=Sony+Headphones",
      rating: 4.6,
      reviews: 150,
      price: 7990,
      originalPrice: 10990,
    },
    {
      id: 5,
      name: "Apple Watch Series 9",
      image: "https://placehold.co/400x400/e2e8f0/64748b?text=Apple+Watch",
      rating: 4.5,
      reviews: 175,
      price: 39900,
      originalPrice: 45900,
    },
    {
      id: 6,
      name: "Canon EOS R50",
      image: "https://placehold.co/400x400/e2e8f0/64748b?text=Canon+Camera",
      rating: 4.6,
      reviews: 110,
      price: 58990,
      originalPrice: 64990,
    },
  ];
  const totalPages = 5;
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div>
        <div className="mt-4">
          <h1 className="text-3xl font-bold text-gray-900">All Products</h1>
          <p className="text-gray-500 font-medium mt-1 text-base">
            Explore our collection of products.
          </p>
        </div>
        <div className="flex flex-col lg:flex-row gap-8 mt-8">
          {/* filters sidebar */}
          <div className="w-full lg:w-64 shrink-0 border border-border bg-white rounded-xl p-6 h-fit">
            <p className="text-base font-bold text-gray-900">Category</p>
            <form className="mt-3">
              <div className="space-y-2">
                {categories.map((category) => (
                  <label
                    key={category.label}
                    className="flex items-center gap-2.5 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="rounded text-primary focus:ring-primary h-4 w-4"
                    />
                    <span className="text-sm font-bold cursor-pointer">
                      {category.label}
                    </span>
                  </label>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-base font-bold text-gray-900 mb-3">Brands</p>
                <div className="space-y-2">
                  {brands.map((brand) => (
                    <label
                      key={brand.label}
                      className="flex items-center gap-2.5 cursor-pointer font-bold"
                    >
                      <input
                        type="checkbox"
                        className="rounded text-primary focus:ring-primary h-4 w-4"
                      />
                      <span className="text-sm font-bold cursor-pointer">
                        {brand.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-base font-bold text-gray-900 mb-3">
                  Price Range
                </p>
                <div className="flex gap-3 items-center">
                  <input
                    type="number"
                    placeholder="Min"
                    className="border border-border bg-surface w-full py-2 px-3 rounded-md focus:outline-primary text-sm"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    className="border border-border bg-surface w-full py-2 px-3 rounded-md focus:outline-primary text-sm"
                  />
                </div>
                <div className="space-y-2 mt-6">
                  <button
                    type="button"
                    className="bg-primary font-semibold text-white px-4 py-2 rounded-lg w-full hover:bg-primary-hover transition-colors"
                  >
                    Apply
                  </button>
                  <button
                    type="button"
                    className="border border-gray-200 text-gray-600 font-semibold px-4 py-2 rounded-lg w-full hover:bg-gray-50 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* products area */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-500 text-sm">
                Showing{" "}
                <span className="font-bold text-gray-900">
                  {featuredProducts.length}
                </span>{" "}
                products
              </p>
              <div>
                <select className="border border-border rounded-lg px-3 py-2 bg-white text-sm focus:outline-primary font-medium text-gray-700">
                  <option value="" disabled selected>
                    Sort by
                  </option>
                  {filters.map((filter) => (
                    <option key={filter} value={filter}>
                      {filter}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="flex justify-center items-center mt-12">
              <Pagination totalPages={totalPages} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
