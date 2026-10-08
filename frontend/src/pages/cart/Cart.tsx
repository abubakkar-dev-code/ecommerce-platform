import { Link } from "react-router-dom";
const Cart = () => {
  const cartItems = [
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
  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold">Your Cart</h1>
        <p className="text-muted text-xs mt-2 font-bold ">
          {cartItems && cartItems.length !== 0
            ? `${cartItems.length} items in your products`
            : "cart is empty,start shopping"}
        </p>
        <div className="flex space-x-8 mt-12">
          <div className="space-y-7 w-[70%]">
            {cartItems.map((Item) => (
              <div
                key={Item.id}
                className="flex border border-gray-300 rounded-lg py-5 px-8 justify-between hover:shadow-lg h-37.5"
              >
                <div className="b gap-6 flex">
                  <img className="w-36 h-auto bg-gray-500 src={Item.image} alt={Item.name} rounded-lg" />
                  <div>
                    <p className="text-black font-semibold">{Item.name}</p>
                    <p className="text-muted font-semibold">{Item.variant}</p>
                    <p
                      className={`font-bold text-sm mt-2 ${
                        Item.stock === "In stock"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {Item.stock}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-20">
                  <div className="border-gray-400 flex gap-5 items-center border px-4 py-3 rounded-lg">
                    <button>-</button>
                    <p>{Item.quantity}</p>
                    <button>+</button>
                  </div>
                  <div>
                    <p className="text-black font-bold text-xl">
                      ${Item.price * Item.quantity}
                    </p>
                    <button className="mt-3 bg-red-600 text-white px-2 py-1 rounded-md text-xs">
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* order summary */}
          <div className="border border-gray-200 w-[30%] h-fit rounded-lg p-6">
            <div>
              <h1 className="text-2xl font-bold">Order Summary</h1>
              <div className="mt-10 flex flex-col gap-5">
                {orderSummary.map((order) => (
                  <div key={order.label} className="flex justify-between">
                    <p
                      className={`${order.isBold ? "text-black font-bold text-xl" : "text-sm text-muted font-bold"}`}
                    >
                      {order.label}
                    </p>
                    <p className="font-semibold">{order.value}</p>
                  </div>
                ))}
                <p className="w-full bg-gray-300"></p>
                <div className="mt-2">
                  <Link to="/checkout">
                    <button className="bg-primary text-white px-4 py-2 rounded-lg w-full font-semibold">
                      proceed to checkout
                    </button>
                  </Link>
                  <div className="text-center mt-3">
                    <Link
                      to="/products"
                      className="text-sm font-semibold text-primary"
                    >
                      Continue shopping
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
