const products = [
  {
    id: 1,
    name: "iPhone 15",
    image: "https://placehold.co/400x400?text=iPhone+15",
    rating: 4.5,
    reviews: 120,
    price: 79900,
    comparedAt: 89000,
  },
  {
    id: 2,
    name: "Samsung Galaxy S24",
    image: "https://placehold.co/400x400?text=Galaxy+S24",
    rating: 4.4,
    reviews: 98,
    price: 64999,
    comparedAt: 74999,
  },
  {
    id: 3,
    name: "MacBook Air M2",
    image: "https://placehold.co/400x400?text=MacBook+Air",
    rating: 4.7,
    reviews: 200,
    price: 89900,
    comparedAt: 99900,
  },
  {
    id: 4,
    name: "Sony Headphones",
    image: "https://placehold.co/400x400?text=Sony+Headphones",
    rating: 4.6,
    reviews: 150,
    price: 7990,
    comparedAt: 10990,
  },
];

const FeaturedProducts = () => {
  return (
    <section className="mx-auto mt-12 max-w-7xl">
      {/* Section Header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-text">Featured Products</h2>

        <button
          type="button"
          className="font-medium text-primary hover:text-primary-hover"
        >
          View All →
        </button>
      </div>

      {/* Products */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="overflow-hidden rounded-xl border border-border bg-surface transition hover:shadow-md"
          >
            {/* Product Image */}
            <div className="flex h-56 items-center justify-center bg-background p-4">
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-contain"
              />
            </div>

            {/* Product Information */}
            <div className="p-4">
              <h3 className="font-semibold text-text">{product.name}</h3>

              {/* Rating */}
              <div className="mt-2 flex items-center gap-1 text-sm">
                <span className="text-warning">★</span>

                <span className="font-medium text-text">{product.rating}</span>

                <span className="text-muted">({product.reviews})</span>
              </div>

              {/* Price */}
              <div className="mt-3 flex items-center gap-2">
                <span className="text-lg font-bold text-text">
                  ₹{product.price.toLocaleString("en-IN")}
                </span>

                <span className="text-sm text-muted line-through">
                  ₹{product.comparedAt.toLocaleString("en-IN")}
                </span>
              </div>

              {/* Add to Cart */}
              <button
                type="button"
                className="mt-4 w-full rounded-md border border-primary px-4 py-2 font-medium text-primary transition hover:bg-primary hover:text-white"
              >
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturedProducts;
