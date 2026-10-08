import React, { useState } from "react";


const Checkout = () => {
  const [selectedAddressId, setSelectedAddressId] = useState<number>(1);
  const [formMode, setFormMode] = useState<"add" | "edit" | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("online Payment");

  const [addressData, setAddressData] = useState([
    {
      id: 1,
      name: "John Doe",
      phone: "9876543210",
      line1: "12 Main Street",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600001",
    },
    {
      id: 2,
      name: "John Doe",
      phone: "9876543210",
      line1: "12 Main Street",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600001",
    },
  ]);
  const orderItems = [
    {
      id: 1,
      name: "Aero Wireless Headphones",
      image: "/images/aero-headphones.jpg",
      variant: "Color: Midnight Blue",
      stock: "In stock",
      price: 129.0,
      quantity: 2,
    },
    {
      id: 2,
      name: "Pulse Smart Watch",
      image: "/images/pulse-watch.jpg",
      variant: "Size: 44mm · Strap: Silver",
      stock: "Only 3 left",
      price: 199.0,
      quantity: 1,
    },
    {
      id: 3,
      name: "Urban Leather Backpack",
      image: "/images/urban-backpack.jpg",
      variant: "Color: Tan · 20L",
      stock: "In stock",
      price: 79.0,
      quantity: 2,
    },
  ];
  const orderSummary = [
    {
      label: "subtotal",
      value: "$130.00",
    },
    {
      label: "shipping",
      value: "$20.00",
    },
    {
      label: "tax",
      value: "$10.00",
    },
    {
      label: "total",
      value: "$160.00",
      isBold: true,
    },
  ];
  const paymentMethods = [
    { id: 1, name: "online Payment", description: "UPI/creditcard/Netbanking" },
    {
      id: 2,
      name: "Cash On Delivery",
      description: "Pay when you receive the product",
    },
  ];
  const [formData, setFormData] = useState({
    id: 0,
    name: "",
    phone: "",
    line1: "",
    city: "",
    state: "",
    pincode: "",
  });

  const handleAddressChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleClick = () => {
    if (formMode === "add") {
      const newAddress = {
        id: addressData.length + 1,
        name: formData.name,
        phone: formData.phone,
        line1: formData.line1,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
      };

      setAddressData((prev) => [...prev, newAddress]);
    }
    if (formMode === "edit") {
      setAddressData((prev) =>
        prev.map((address) =>
          address.id === formData.id
            ? {
                ...address,
                name: formData.name,
                phone: formData.phone,
                line1: formData.line1,
                city: formData.city,
                state: formData.state,
                pincode: formData.pincode,
              }
            : address,
        ),
      );
    }
    setFormData({
      id: 0,
      name: "",
      phone: "",
      line1: "",
      city: "",
      state: "",
      pincode: "",
    });
    setFormMode(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">Checkout</h1>
      <div className="flex gap-8 mt-6">
        <div className="border border-gray-300 w-[70%] rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Delivery Address</h2>
          <div className="space-y-3">
            {formMode === "add" || formMode === "edit" ? (
              <div className="bg-white border border-border rounded-xl p-6">
                <h3 className="text-lg font-semibold text-text mb-6">
                  Add Delivery Address
                </h3>
                <form className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Name
                    </label>
                    <input
                      name="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={handleAddressChange}
                      className="w-full px-4 py-3 border border-border rounded-lg bg-background text-text outline-none transition focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Phone
                    </label>
                    <input
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleAddressChange}
                      placeholder="Enter your phone number"
                      className="w-full px-4 py-3 border border-border rounded-lg bg-background placeholder:text-muted outline-none transition focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-text mb-2">
                      Address
                    </label>
                    <textarea
                      name="line1"
                      rows={3}
                      value={formData.line1}
                      onChange={handleAddressChange}
                      placeholder="House number, street, area"
                      className="w-full px-4 py-3 border border-border rounded-lg bg-background placeholder:text-muted outline-none transition resize-y focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      City
                    </label>

                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleAddressChange}
                      placeholder="Enter your city"
                      className="w-full px-4 py-3 border border-border rounded-lg bg-background placeholder:text-muted outline-none transition focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      State
                    </label>

                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleAddressChange}
                      placeholder="Enter your state"
                      className="w-full px-4 py-3 border border-border rounded-lg bg-background placeholder:text-muted outline-none transition focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Pincode
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleAddressChange}
                      inputMode="numeric"
                      placeholder="Enter your pincode"
                      className="w-full px-4 py-3 border border-border rounded-lg bg-background placeholder:text-muted outline-none transition focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setFormMode(null)}
                      className="px-5 py-2.5 border border-border rounded-lg text-text font-medium hover:bg-background transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleClick}
                      className="px-5 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover transition"
                    >
                      {formMode === "edit" ? "Update Address" : "Add Address"}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              addressData.map((address) => {
                const isSelected = selectedAddressId === address.id;

                return (
                  <div
                    key={address.id}
                    onClick={() => setSelectedAddressId(address.id)}
                    className={`flex justify-between p-5 border rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary bg-blue-50/40 ring-1 ring-primary"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex gap-4 items-start">
                      <input
                        type="radio"
                        name="delivery-address"
                        checked={isSelected}
                        onChange={() => setSelectedAddressId(address.id)}
                        className="mt-1 h-5 w-5 text-primary accent-primary cursor-pointer"
                      />

                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {address.name}
                        </h3>

                        <p className="text-gray-600 text-sm">{address.line1}</p>

                        <p className="text-gray-600 text-sm">
                          {address.city}, {address.state} - {address.pincode}
                        </p>

                        <p className="text-gray-500 text-sm mt-1">
                          Phone: {address.phone}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData({
                          id: address.id,
                          name: address.name,
                          phone: address.phone,
                          line1: address.line1,
                          city: address.city,
                          state: address.state,
                          pincode: address.pincode,
                        });
                        setFormMode("edit");
                      }}
                      className="text-primary font-semibold text-sm hover:underline self-start"
                    >
                      Edit
                    </button>
                  </div>
                );
              })
            )}

            <div>
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    id: 0,
                    name: "",
                    phone: "",
                    line1: "",
                    city: "",
                    state: "",
                    pincode: "",
                  });

                  setFormMode("add");
                }}
                className="text-white text-sm font-semibold px-6 py-3 rounded-lg mt-5 bg-primary"
              >
                + Add address
              </button>
            </div>
          </div>
        </div>

        {/* order-summary */}
        <div className="border border-gray-200 w-[30%] h-fit rounded-xl p-6 sticky top-24">
          <div>
            <h1 className="text-2xl font-bold">Order Summary</h1>

            <div className="mt-8 flex flex-col gap-4">
              {orderSummary.map((order) => (
                <div
                  key={order.label}
                  className="flex justify-between items-center"
                >
                  <p
                    className={`${
                      order.isBold
                        ? "text-black font-bold text-xl capitalize"
                        : "text-sm text-gray-500 font-medium capitalize"
                    }`}
                  >
                    {order.label}
                  </p>

                  <p
                    className={`${
                      order.isBold
                        ? "text-black font-bold text-xl"
                        : "font-semibold text-gray-800"
                    }`}
                  >
                    {order.value}
                  </p>
                </div>
              ))}
              <p className="text-sm font-semibold flex gap-4">Payment:<span className="text-green-600">{paymentMethod}</span></p>
              <div className="w-full h-px bg-gray-200 my-2"></div>

              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => alert("Order Placed Successfully!")}
                  className="bg-primary text-white px-4 py-3 rounded-xl w-full font-semibold hover:bg-primary-hover shadow-md hover:shadow-lg transition-all active:scale-[0.99]"
                >
                  Pay Now
                </button>

                <div className="text-center mt-3">
                  <span className="text-xs text-gray-400">
                    You choose how to pay on the next step
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Ordered Items ({orderItems.length})
        </h2>
        <div className="space-y-4">
          {orderItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-5 border border-gray-200 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex gap-5 items-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        `https://placehold.co/200x200/e2e8f0/64748b?text=${encodeURIComponent(
                          item.name,
                        )}`;
                    }}
                  />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900">
                    {item.name}
                  </h3>
                  <p className="text-gray-500 text-sm mt-0.5">{item.variant}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md">
                      Qty: {item.quantity}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        item.stock === "In stock"
                          ? "text-emerald-600"
                          : "text-amber-600"
                      }`}
                    >
                      {item.stock}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
                {item.quantity > 1 && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    ${item.price.toFixed(2)} each
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-900 mt-7">Payment Method</h2>
        <div className="mt-5 space-y-6">
          {paymentMethods.map((method) => {
            const selected = paymentMethod === method.name;
            return (
              <div
                onClick={() => setPaymentMethod(method.name)}
                key={method.id}
                className={`border border-gray-300 rounded-lg py-7 px-5 ${selected ? "border-primary" : ""}`}
              >
                <div className="flex gap-5 items-center">
                  <input
                    type="radio"
                    className="w-4 h-4"
                    checked={selected}
                    onChange={() => setPaymentMethod(method.name)}
                  />
                  <div>
                    <p className="font-bold">{method.name}</p>
                    <p className="text-sm text-gray-400 font-bold">
                      {method.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Checkout;
