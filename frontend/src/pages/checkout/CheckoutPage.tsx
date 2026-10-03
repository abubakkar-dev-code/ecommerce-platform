import { useEffect, useState } from "react";
import addressService from "../../services/address.service";
import toast from "react-hot-toast";
import orderService from "../../services/order.service";
import paymentService from "../../services/payment.service";

declare global {
  interface Window {
    Razorpay: any;
  }
}

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

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        const response = await addressService.getAddress();

        if (response.data) {
          setFormData({
            fullName: response.data.fullName || "",
            phone: response.data.phone || "",
            addressLine1: response.data.addressLine1 || "",
            addressLine2: response.data.addressLine2 || "",
            city: response.data.city || "",
            state: response.data.state || "",
            pincode: response.data.pincode || "",
            country: response.data.country || "India",
          });
        }
      } catch (err: any) {
        console.log(
          err?.response?.data?.message || err?.message
        );
      }
    };

    fetchAddress();
  }, []);

  useEffect(() => {
    if (
      document.getElementById(
        "razorpay-checkout-script"
      )
    ) {
      return;
    }

    const script = document.createElement("script");

    script.id = "razorpay-checkout-script";
    script.src =
      "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;

    script.onload = () => {
      console.log("Razorpay Checkout loaded");
    };

    script.onerror = () => {
      setError("Failed to load Razorpay");
    };

    document.body.appendChild(script);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const addressResponse =
        await addressService.createOrUpdateAddress(
          formData
        );

      const addressId = addressResponse.data._id;

      if (!addressId) {
        throw new Error("Address ID was not returned");
      }

      const orderResponse =
        await orderService.createOrder(addressId);

      const orderId = orderResponse.data._id;

      if (!orderId) {
        throw new Error("Order ID was not returned");
      }

      const paymentResponse =
        await paymentService.createPayment(orderId);

      const paymentData = paymentResponse.data;

      if (!paymentData?.razorpayOrderId) {
        throw new Error(
          "Razorpay order ID was not returned"
        );
      }

      if (!paymentData?.razorpayKeyId) {
        throw new Error(
          "Razorpay key ID was not returned"
        );
      }

      if (!window.Razorpay) {
        throw new Error(
          "Razorpay is not loaded yet"
        );
      }

      const options = {
        key: paymentData.razorpayKeyId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: "E-Commerce Platform",
        description: "Order Payment",
        order_id: paymentData.razorpayOrderId,

        handler: async (response: any) => {
          try {
            const verifyResponse =
              await paymentService.verifyPayment({
                razorpay_order_id:
                  response.razorpay_order_id,
                razorpay_payment_id:
                  response.razorpay_payment_id,
                razorpay_signature:
                  response.razorpay_signature,
              });

            console.log(
              "Payment verification response:",
              verifyResponse
            );

            toast.success(
              "Payment verified successfully"
            );
          } catch (err: any) {
            console.error(
              "Payment verification failed:",
              err
            );

            toast.error(
              err?.response?.data?.message ||
                "Payment verification failed"
            );
          }
        },

        modal: {
          ondismiss: () => {
            toast.error("Payment cancelled");
          },
        },
      };

      const razorpay =
        new window.Razorpay(options);

      razorpay.open();
    } catch (err: any) {
      console.error("Checkout error:", err);

      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create order";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-10">
      <div className="mx-auto w-[90%] max-w-6xl">
        <h1 className="mb-8 text-3xl font-bold text-text">
          Checkout
        </h1>

        {error && (
          <div className="mb-6 rounded-lg border border-error bg-red-50 p-4 text-error">
            {error}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-xl bg-surface p-6 shadow-sm">
              <h2 className="mb-6 text-xl font-semibold text-text">
                Shipping Address
              </h2>

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                <div>
                  <label className="mb-2 block text-sm font-medium text-text">
                    Full Name
                  </label>

                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-border px-4 py-3 outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-text">
                    Phone
                  </label>

                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-border px-4 py-3 outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-text">
                    Address Line 1
                  </label>

                  <input
                    type="text"
                    name="addressLine1"
                    value={formData.addressLine1}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-border px-4 py-3 outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-text">
                    Address Line 2
                  </label>

                  <input
                    type="text"
                    name="addressLine2"
                    value={formData.addressLine2}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-border px-4 py-3 outline-none focus:border-primary"
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-text">
                      City
                    </label>

                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg border border-border px-4 py-3 outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-text">
                      State
                    </label>

                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg border border-border px-4 py-3 outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-text">
                      Pincode
                    </label>

                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg border border-border px-4 py-3 outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-text">
                      Country
                    </label>

                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg border border-border px-4 py-3 outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-primary px-6 py-3 font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Processing..."
                    : "Proceed to Payment"}
                </button>
              </form>
            </div>
          </div>

          <div>
            <div className="rounded-xl bg-surface p-6 shadow-sm">
              <h2 className="mb-6 text-xl font-semibold text-text">
                Order Summary
              </h2>

              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <p className="font-medium text-text">
                    iPhone 15
                  </p>

                  <p className="text-sm text-muted">
                    Quantity: 1
                  </p>
                </div>

                <p className="font-semibold text-text">
                  ₹79,900
                </p>
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">
                    Subtotal
                  </span>

                  <span className="text-text">
                    ₹79,900
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted">
                    Shipping
                  </span>

                  <span className="text-success">
                    Free
                  </span>
                </div>

                <div className="flex justify-between border-t border-border pt-4 text-lg font-bold">
                  <span className="text-text">
                    Total
                  </span>

                  <span className="text-text">
                    ₹79,900
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

