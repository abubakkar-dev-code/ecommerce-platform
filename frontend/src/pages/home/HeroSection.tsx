const HeroSection = () => {
  return (
    <section className="mx-auto mt-6 max-w-7xl rounded-2xl bg-blue-50 px-12 py-16">
      <div className="flex items-center justify-between gap-10">
        {/* Left Content */}
        <div className="max-w-xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-primary">
            New Arrivals
          </p>

          <h1 className="text-5xl font-bold leading-tight text-text">
            Upgrade Your
            <br />
            Tech Lifestyle
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-muted">
            Discover the latest gadgets, electronics and more at unbeatable
            prices.
          </p>

          <button
            type="button"
            className="mt-8 rounded-md bg-primary px-6 py-3 font-semibold text-white hover:bg-primary-hover"
          >
            Shop Now →
          </button>
        </div>

        {/* Right Side - Image Placeholder */}
        <div className="flex h-72 w-1/2 items-center justify-center rounded-xl bg-white">
          <img
            src="./assets/images/heroimg.png"
            alt="Latest electronics"
            className="h-72 w-full object-contain"
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
