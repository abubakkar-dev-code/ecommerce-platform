const Footer = () => {
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      {/* Main Footer */}
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {/* Brand */}
        <div>
          <h2 className="text-xl font-bold text-primary">
            ShopEase
          </h2>

          <p className="mt-4 max-w-xs text-sm leading-6 text-muted">
            Your trusted destination for quality products, great
            prices, and a simple shopping experience.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="font-semibold text-text">
            Quick Links
          </h3>

          <ul className="mt-4 space-y-3 text-sm text-muted">
            <li>
              <a
                href="/"
                className="transition hover:text-primary"
              >
                Home
              </a>
            </li>

            <li>
              <a
                href="/products"
                className="transition hover:text-primary"
              >
                Products
              </a>
            </li>

            <li>
              <a
                href="/wishlist"
                className="transition hover:text-primary"
              >
                Wishlist
              </a>
            </li>

            <li>
              <a
                href="/orders"
                className="transition hover:text-primary"
              >
                My Orders
              </a>
            </li>
          </ul>
        </div>

        {/* Customer Service */}
        <div>
          <h3 className="font-semibold text-text">
            Customer Service
          </h3>

          <ul className="mt-4 space-y-3 text-sm text-muted">
            <li>
              <a
                href="#"
                className="transition hover:text-primary"
              >
                Contact Us
              </a>
            </li>

            <li>
              <a
                href="#"
                className="transition hover:text-primary"
              >
                Shipping Information
              </a>
            </li>

            <li>
              <a
                href="#"
                className="transition hover:text-primary"
              >
                Returns & Refunds
              </a>
            </li>

            <li>
              <a
                href="#"
                className="transition hover:text-primary"
              >
                Privacy Policy
              </a>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="font-semibold text-text">
            Contact Us
          </h3>

          <div className="mt-4 space-y-3 text-sm text-muted">
            <p>support@shopease.com</p>
            <p>+91 98765 43210</p>
            <p>Chennai, Tamil Nadu, India</p>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-sm text-muted sm:px-6 md:flex-row lg:px-8">
          <p>
            © 2026 ShopEase. All rights reserved.
          </p>

          <p>
            Built with React & TypeScript
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;