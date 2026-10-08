import {
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaFacebookF,
  FaInstagram,
  FaGithub,
  FaTwitter,
} from "react-icons/fa";

const Footer = () => {
  const footerData = {
    brand: {
      name: "ShopEase",
      description:
        "Your trusted destination for quality products, great prices, and a simple shopping experience.",
    },

    quickLinks: [
      { id: 1, label: "Home", href: "/" },
      { id: 2, label: "Products", href: "/products" },
      { id: 3, label: "Wishlist", href: "/wishlist" },
      { id: 4, label: "My Orders", href: "/orders" },
    ],

    customerService: [
      { id: 1, label: "Contact Us", href: "#" },
      { id: 2, label: "Shipping Information", href: "#" },
      { id: 3, label: "Returns & Refunds", href: "#" },
      { id: 4, label: "Privacy Policy", href: "#" },
    ],

    contact: [
      {
        id: 1,
        type: "email",
        value: "support@shopease.com",
        href: "mailto:support@shopease.com",
      },
      {
        id: 2,
        type: "phone",
        value: "+91 98765 43210",
        href: "tel:+919876543210",
      },
      {
        id: 3,
        type: "address",
        value: "Chennai, Tamil Nadu, India",
      },
    ],
  };

  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        {/* Main Footer */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <h2 className="text-2xl font-bold text-primary">
              {footerData.brand.name}
            </h2>

            <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
              {footerData.brand.description}
            </p>

            {/* Social Links */}
            <div className="mt-6 flex items-center gap-3">
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border transition hover:bg-primary hover:text-white"
              >
                <FaFacebookF size={14} />
              </a>

              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border transition hover:bg-primary hover:text-white"
              >
                <FaInstagram size={14} />
              </a>

              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border transition hover:bg-primary hover:text-white"
              >
                <FaTwitter size={14} />
              </a>

              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border transition hover:bg-primary hover:text-white"
              >
                <FaGithub size={14} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider">
              Quick Links
            </h3>

            <ul className="mt-5 space-y-3">
              {footerData.quickLinks.map((link) => (
                <li key={link.id}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground transition hover:text-primary"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider">
              Customer Service
            </h3>

            <ul className="mt-5 space-y-3">
              {footerData.customerService.map((link) => (
                <li key={link.id}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground transition hover:text-primary"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider">
              Contact Us
            </h3>

            <ul className="mt-5 space-y-4">
              {footerData.contact.map((item) => (
                <li key={item.id} className="flex items-start gap-3">
                  <div className="mt-0.5 text-primary">
                    {item.type === "email" && <FaEnvelope size={14} />}
                    {item.type === "phone" && <FaPhone size={14} />}
                    {item.type === "address" && <FaMapMarkerAlt size={14} />}
                  </div>

                  {item.href ? (
                    <a
                      href={item.href}
                      className="text-sm text-muted-foreground transition hover:text-primary"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {item.value}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {footerData.brand.name}. All rights
            reserved.
          </p>

          <p>Built with React & TypeScript</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
