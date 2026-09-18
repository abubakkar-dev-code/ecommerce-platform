import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import addressService from "../../services/address.service";

const Checkout = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });

  const [address, setAddress] = useState(null);

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        const response = await addressService.getAddress();
        setAddress(response.data);
      } catch (error: any) {
        setError(error.message);
      }
    };

    fetchAddress();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await addressService.createOrUpdateAddress(formData);

      setAddress(response.data);

      console.log(response.data);
    } catch (err) {
      setError("Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text">Checkout</h1>

        <p className="mt-2 text-muted">
          Complete your order by providing your shipping details.
        </p>
      </div>

      {/* Checkout Layout */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Section */}
        <section className="space-y-8 lg:col-span-2">
          {/* Shipping Address */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold text-text">
              Shipping Address
            </h2>

            <p className="mt-1 text-sm text-muted">
              Enter the address where you want your order delivered.
            </p>
            <form onSubmit={handleSubmit}>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-text">
                    Full Name
                  </label>

                  <input
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="w-full rounded-md border border-border bg-surface px-4 py-3 text-sm outline-none transition focus:border-primary"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-text">
                    Phone Number
                  </label>

                  <input
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                    className="w-full rounded-md border border-border bg-surface px-4 py-3 text-sm outline-none transition focus:border-primary"
                  />
                </div>

                {/* Address Line 1 */}
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-text">
                    Address Line 1
                  </label>

                  <input
                    type="text"
                    name="addressLine1"
                    value={formData.addressLine1}
                    onChange={handleChange}
                    placeholder="House number, street name"
                    className="w-full rounded-md border border-border bg-surface px-4 py-3 text-sm outline-none transition focus:border-primary"
                  />
                </div>

                {/* Address Line 2 */}
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-text">
                    Address Line 2
                  </label>

                  <input
                    name="addressLine2"
                    value={formData.addressLine2}
                    onChange={handleChange}
                    type="text"
                    placeholder="Apartment, landmark, etc. (optional)"
                    className="w-full rounded-md border border-border bg-surface px-4 py-3 text-sm outline-none transition focus:border-primary"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-text">
                    City
                  </label>

                  <input
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    type="text"
                    placeholder="Enter your city"
                    className="w-full rounded-md border border-border bg-surface px-4 py-3 text-sm outline-none transition focus:border-primary"
                  />
                </div>

                {/* State */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-text">
                    State
                  </label>

                  <input
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    type="text"
                    placeholder="Enter your state"
                    className="w-full rounded-md border border-border bg-surface px-4 py-3 text-sm outline-none transition focus:border-primary"
                  />
                </div>

                {/* Pincode */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-text">
                    Pincode
                  </label>

                  <input
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    type="text"
                    placeholder="Enter your pincode"
                    className="w-full rounded-md border border-border bg-surface px-4 py-3 text-sm outline-none transition focus:border-primary"
                  />
                </div>

                {/* Country */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-text">
                    Country
                  </label>

                  <input
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    type="text"
                    readOnly
                    className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-muted outline-none"
                  />
                </div>
              </div>
            </form>
          </div>

          {/* Order Review */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold text-text">Order Review</h2>

            <p className="mt-1 text-sm text-muted">
              Review your products before placing the order.
            </p>

            <div className="mt-6 flex flex-col gap-5 border-t border-border pt-6 sm:flex-row">
              <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-lg bg-background p-3">
                <img
                  src="https://placehold.co/200x200?text=iPhone+15"
                  alt="iPhone 15"
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-text">iPhone 15</h3>

                  <p className="mt-1 text-sm text-muted">Storage: 128GB</p>

                  <p className="mt-2 text-sm text-muted">Quantity: 1</p>
                </div>

                <div className="mt-3 sm:mt-0">
                  <span className="font-semibold text-text">₹79,900</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Section */}
        <aside className="h-fit rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-text">Order Summary</h2>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Subtotal</span>

              <span className="font-medium text-text">₹79,900</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Shipping</span>

              <span className="font-medium text-success">Free</span>
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-text">Total</span>

                <span className="text-xl font-bold text-text">₹79,900</span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="mt-8 border-t border-border pt-6">
            <h3 className="text-sm font-semibold text-text">Payment Method</h3>

            <div className="mt-3 rounded-lg border-2 border-primary bg-background p-4">
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="payment"
                  value="razorpay"
                  defaultChecked
                  className="mt-1 accent-primary"
                />

                <div>
                  <p className="text-sm font-medium text-text">
                    Online Payment
                  </p>

                  <p className="mt-1 text-xs text-muted">
                    UPI, Cards, Net Banking & Wallets
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Place Order */}
          <button
            type="submit"
            className="mt-6 w-full rounded-md bg-primary px-6 py-3 font-medium text-white transition hover:bg-primary-hover"
          >
            <Link to="/orders">Place Order & Pay</Link>
          </button>

          <p className="mt-3 text-center text-xs text-muted">
            Your payment will be securely processed.
          </p>
        </aside>
      </div>
    </main>
  );
};

export default Checkout;
