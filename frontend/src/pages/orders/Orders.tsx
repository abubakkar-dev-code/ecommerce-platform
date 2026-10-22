import Button from "../../componenets/UI/Button";
import { Link } from "react-router-dom";

export const Orders = () => {
  const orders = [
    {
      orderId: "NXR1024",
      status: "delivered",
      placedOn: "Oct 5, 2026",
      deliveredDate: "Delivered on : Oct 8, 2026",
      product: {
        name: "Wireless Headphones",
        quantity: 1,
        price: 2499,
      },
      address: {
        customerName: "Rahul Sharma",
        street: "123 Anna Salai",
        city: "Chennai",
        state: "Tamil Nadu",
        postalCode: "600002",
        country: "India",
      },
    },
    {
      orderId: "NXR1025",
      status: "processing",
      placedOn: "Oct 6, 2026",
      estimatedDelivery: "estimated delivery on : Oct 12, 2026",
      paymentMethod: "UPI",
      product: {
        name: "Bluetooth Speaker",
        quantity: 2,
        price: 3499,
      },
      address: {
        customerName: "Priya Menon",
        street: "45 MG Road",
        city: "Chennai",
        state: "Tamil Nadu",
        postalCode: "600034",
        country: "India",
      },
    },
    {
      orderId: "NXR1026",
      status: "cancelled",
      placedOn: "Oct 7, 2026",
      cancellationDate: "cancelled on : Oct 7, 2026",
      product: {
        name: "Smartwatch",
        quantity: 1,
        price: 5999,
      },
      address: {
        customerName: "Arjun Kumar",
        street: "78 T Nagar",
        city: "Chennai",
        state: "Tamil Nadu",
        postalCode: "600017",
        country: "India",
      },
    },
    {
      orderId: "NXR1027",
      status: "shipped",
      placedOn: "Oct 8, 2026",
      deliveryDate: "Delivery on : Oct 8, 2026",
      paymentMethod: "UPI",
      product: {
        name: "Gaming Mouse",
        quantity: 1,
        price: 1999,
      },
      address: {
        customerName: "Sneha Reddy",
        street: "12 Velachery Main Road",
        city: "Chennai",
        state: "Tamil Nadu",
        postalCode: "600042",
        country: "India",
      },
    },
    {
      orderId: "NXR1028",
      status: "out_for_delivery",
      placedOn: "Oct 8, 2026",
      estimatedDelivery: "Delivery today: Oct 9, 2026",
      paymentMethod: "COD",
      product: { name: "Wireless Keyboard", quantity: 1, price: 1999 },
      address: {
        customerName: "Vikram Iyer",
        street: "99 OMR",
        city: "Chennai",
        state: "Tamil Nadu",
        postalCode: "600119",
        country: "India",
      },
    },
  ];

  return (
    <div className="max-w-7xl mx-auto mt-10 p-3">
      <div>
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">My orders</h1>
          <p className="text-sm text-gray-500 font-bold ">(3) orders</p>
        </div>
        <p className="text-sm text-gray-500 font-semibold mt-2">
          Track,manage and view your purchases.
        </p>
        <div className="flex flex-col gap-3 mt-5">
          {orders.map((order) => (
            <div
              key={order.orderId}
              className="border border-gray-200 px-5 py-5 rounded-lg p-2"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-bold">Order #{order.orderId}</h2>
                  <p className="text-xs text-muted font-semibold">
                    placed on: {order.placedOn}
                  </p>
                </div>
                <div>
                  <p
                    className={`font-semibold text-xs px-1 py-1 rounded-md bg-gray-300 ${
                      order.status === "delivered" ||
                      order.status === "shipped" ||
                      order.status === "out_for_delivery"
                        ? "text-green-600 bg-green-100"
                        : order.status === "processing"
                          ? " text-blue-600 bg-blue-100"
                          : " text-red-600 bg-red-100"
                    }`}
                  >
                    {order.status}
                  </p>
                </div>
              </div>
              <div className="flex  space-x-10 mt-10">
                <div className="w-32 h-32 bg-gray-200 rounded-lg">
                  <img src="" alt="product-image" />
                </div>
                <div className="flex flex-col gap-5">
                  <h3 className="font-bold">{order.product.name}</h3>
                  <p className="text-muted text-sm font-semibold">
                    Quantity: {order.product.quantity}
                  </p>
                  <p className="font-bold">{`₹${order.product.price * order.product.quantity}`}</p>
                </div>
              </div>
              <hr className="border-gray-300 my-5" />
              <div>
                <div>
                  <p className="font-semibold text-sm text-muted">
                    {order.status === "delivered"
                      ? order.deliveryDate
                      : order.status === "shipped"
                        ? order.deliveryDate
                        : order.status === "processing"
                          ? order.estimatedDelivery
                          : order.cancellationDate}
                  </p>
                </div>
                <div className="flex justify-end">
                  {order.status === "delivered" ||
                  order.status === "cancelled" ? (
                    <div className="space-x-7">
                      <Link
                        to={`/order-details/${order.orderId}`}
                        state={{ order }}
                      >
                        <button className="border px-3 py-2.5 rounded-lg">
                          View Details
                        </button>
                      </Link>
                      <Button>Buy Again</Button>
                    </div>
                  ) : (
                    <div className="space-x-5">
                      <button className="border px-3 py-2.5 rounded-lg">
                        Track Order
                      </button>
                      <Link
                        to={`/order-details/${order.orderId}`}
                        state={{ order }}
                      >
                        <Button>View Details</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div></div>
      </div>
    </div>
  );
};
