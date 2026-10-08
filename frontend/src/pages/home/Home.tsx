import { Link } from "react-router-dom";
import Category from "../../componenets/categories/Category";
import Hero from "../../componenets/hero/Hero";
import ProductCard from "../../componenets/products/ProductCard";

const Home = () => {
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
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      <Hero />
      <Category />

      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
          <Link
            to="/products"
            className="text-primary font-semibold text-sm hover:text-blue-700 flex items-center gap-1 group"
          >
            View All{" "}
            <span className="group-hover:translate-x-1 transition-transform">
              &rarr;
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;

