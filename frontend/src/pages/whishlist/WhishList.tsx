import { Heart, ShoppingCart, Trash2 } from "lucide-react";

const products = [
  {
    id: 1,
    name: "iPhone 15",
    image: "https://placehold.co/400x400?text=iPhone+15",
    price: 79900,
    comparedAt: 89000,
  },
  {
    id: 2,
    name: "Samsung Galaxy S24",
    image: "https://placehold.co/400x400?text=Galaxy+S24",
    price: 64999,
    comparedAt: 74999,
  },
  {
    id: 3,
    name: "MacBook Air M2",
    image: "https://placehold.co/400x400?text=MacBook+Air",
    price: 89900,
    comparedAt: 99900,
  },
  {
    id: 4,
    name: "Sony Headphones",
    image: "https://placehold.co/400x400?text=Sony+Headphones",
    price: 7990,
    comparedAt: 10990,
  },
];

const Wishlist = () => {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text">My Wishlist</h1>

        <p className="mt-2 text-muted">
          Save your favorite products for later.
        </p>
      </div>

      {/* Wishlist Products */}
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="overflow-hidden rounded-xl border border-border bg-surface transition hover:shadow-md"
          >
            {/* Image */}
            <div className="relative flex h-56 items-center justify-center bg-background p-4">
              <button
                type="button"
                className="absolute right-3 top-3 rounded-full bg-surface p-2 text-error shadow-sm transition hover:bg-error hover:text-white"
              >
                <Heart size={20} fill="currentColor" />
              </button>

              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-contain"
              />
            </div>

            {/* Product Info */}
            <div className="p-4">
              <h3 className="font-semibold text-text">{product.name}</h3>

              <div className="mt-3 flex items-center gap-2">
                <span className="text-lg font-bold text-text">
                  ₹{product.price.toLocaleString("en-IN")}
                </span>

                <span className="text-sm text-muted line-through">
                  ₹{product.comparedAt.toLocaleString("en-IN")}
                </span>
              </div>

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white transition hover:bg-primary-hover"
                >
                  <ShoppingCart size={17} />
                  Add to Cart
                </button>

                <button
                  type="button"
                  className="rounded-md border border-border px-3 py-2 text-muted transition hover:border-error hover:text-error"
                  title="Remove from wishlist"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Empty Wishlist State */}
      <section className="mt-10 flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-border bg-surface p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background text-error">
          <Heart size={32} />
        </div>

        <h2 className="mt-5 text-xl font-semibold text-text">
          Your wishlist is empty
        </h2>

        <p className="mt-2 max-w-md text-sm text-muted">
          Save products you love and come back to them later.
        </p>

        <a
          href="/products"
          className="mt-6 rounded-md bg-primary px-6 py-3 font-medium text-white transition hover:bg-primary-hover"
        >
          Continue Shopping
        </a>
      </section>
    </main>
  );
};

export default Wishlist;
