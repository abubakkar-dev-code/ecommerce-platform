import { useState } from "react";
import { Link } from "react-router-dom";
import { FaHeart, FaRegHeart, FaStar } from "react-icons/fa";

const initialWishlist = [
  {
    id: 1,
    name: "iPhone 15",
    price: 70000,
    rating: 4.5,
    image: "https://via.placeholder.com/300x300",
  },
  {
    id: 2,
    name: "Samsung Smart TV",
    price: 55000,
    rating: 4.4,
    image: "https://via.placeholder.com/300x300",
  },
  {
    id: 3,
    name: "Nike Running Shoes",
    price: 4999,
    rating: 4.6,
    image: "https://via.placeholder.com/300x300",
  },
  {
    id: 4,
    name: "Laptop",
    price: 65000,
    rating: 4.3,
    image: "https://via.placeholder.com/300x300",
  },
];

const Wishlist = () => {
  const [wishlist, setWishlist] = useState(initialWishlist);

  const handleRemove = (id: number) => {
    setWishlist((prev) => prev.filter((product) => product.id !== id));
  };

  const handleAddToCart = (id: number) => {
    console.log("Add to cart:", id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text">Wishlist</h1>

        <p className="text-muted mt-1">Your saved products</p>

        {wishlist.length > 0 && (
          <p className="text-sm text-muted mt-3">
            {wishlist.length} {wishlist.length === 1 ? "item" : "items"}
          </p>
        )}
      </div>

      {/* Empty Wishlist */}
      {wishlist.length === 0 ? (
        <div className="min-h-100 flex flex-col items-center justify-center border border-border rounded-xl bg-surface">
          <FaRegHeart className="text-5xl text-muted mb-5" />

          <h2 className="text-xl font-bold text-text">
            Your Wishlist is Empty
          </h2>

          <p className="text-muted mt-2 text-center">
            Save products you love and find them here.
          </p>

          <Link
            to="/products"
            className="mt-6 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover transition"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        /* Product Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {wishlist.map((product) => (
            <div
              key={product.id}
              className="bg-surface border border-border rounded-xl overflow-hidden hover:shadow-md transition"
            >
              {/* Image */}
              <div className="relative bg-background h-64">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />

                {/* Remove Wishlist */}
                <button
                  type="button"
                  onClick={() => handleRemove(product.id)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm hover:bg-gray-50 transition"
                >
                  <FaHeart className="text-error text-lg" />
                </button>
              </div>

              {/* Product Details */}
              <div className="p-4">
                <h2 className="font-semibold text-text truncate">
                  {product.name}
                </h2>

                <p className="text-lg font-bold text-text mt-2">
                  ₹{product.price.toLocaleString("en-IN")}
                </p>

                {/* Rating */}
                <div className="flex items-center gap-1 mt-2">
                  <FaStar className="text-warning text-sm" />

                  <span className="text-sm font-medium text-text">
                    {product.rating}
                  </span>
                </div>

                {/* Add To Cart */}
                <button
                  type="button"
                  onClick={() => handleAddToCart(product.id)}
                  className="w-full mt-4 px-4 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover transition"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
