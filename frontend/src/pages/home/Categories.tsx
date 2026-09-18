const CategoriesSection = () => {
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
    <section className="mx-auto mt-10 max-w-7xl">
      <h2 className="mb-6 text-2xl font-bold text-text">Shop by Category</h2>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className="rounded-xl border border-border bg-surface px-4 py-6 text-center transition hover:border-primary hover:shadow-sm"
          >
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-primary">
              {/* Temporary icon */}
              <span className="text-xl">●</span>
            </div>

            <p className="text-sm font-medium text-text">{category}</p>
          </button>
        ))}
      </div>
    </section>
  );
};

export default CategoriesSection;
