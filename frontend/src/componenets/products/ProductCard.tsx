import React from "react";

type Product = {
  id: number;
  name: string;
  image: string;
  rating: number;
  reviews: number;
  price: number;
  originalPrice: number;
};

type ProductCardProps = {
  product: Product;
};

const ProductCard = ({ product }: ProductCardProps) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 p-4 flex flex-col justify-between hover:shadow-lg hover:border-gray-300 transition-all duration-300 group">
      <div>
        {/* Product Image / Placeholder */}
        <div className="w-full aspect-square bg-[#e2e2e2] rounded-xl overflow-hidden flex items-center justify-center relative">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </div>

        {/* Product Details */}
        <div className="mt-4 flex flex-col">
          {/* Product Name */}
          <h3 className="text-base font-bold text-gray-900 truncate" title={product.name}>
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="text-amber-500 text-xs">★</span>
            <span className="text-xs font-bold text-gray-900">{product.rating}</span>
            <span className="text-xs text-gray-500">({product.reviews})</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-base font-bold text-gray-900">
              ₹{product.price.toLocaleString("en-IN")}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-gray-400 line-through">
                ₹{product.originalPrice.toLocaleString("en-IN")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Add to Cart Button */}
      <div className="mt-4">
        <button
          type="button"
          className="w-full py-2 px-4 rounded-lg border border-blue-600 text-blue-600 font-semibold text-sm hover:bg-blue-600 hover:text-white transition-all duration-200 active:scale-[0.98]"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;

