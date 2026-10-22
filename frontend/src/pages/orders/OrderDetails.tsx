import { AiOutlineInbox } from "react-icons/ai";
import { FaBox, FaTruck } from "react-icons/fa";
import { IoLocationOutline, IoCallOutline } from "react-icons/io5";
import { MdOutlineCreditCard } from "react-icons/md";
import { useLocation } from "react-router-dom";
import Button from "../../componenets/UI/Button";

const OrderDetails = () => {
  const location = useLocation();
  const { order } = location.state;
  console.log(order);

  return (
    <div className="max-w-7xl mx-auto">
      <div>
        <div className=" px-6 py-10 mt-10  border border-gray-200 rounded-lg">
          <div className="flex justify-between items-center">
            <h3 className="font-bold">-My Orders</h3>
            <p className="text-muted font-semibold leading-1">Order Details</p>
          </div>
          <hr className="border border-gray-200 my-5"></hr>
          <div>
            <div className="flex justify-between ">
              <div>
                <h2 className="text-lg font-bold">Order: # {order.orderId}</h2>
                <p className="text-muted font-bold text-sm">
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
            <div className="mt-5">
              <div className="border border-gray-200 px-3 py-8 bg-gray-100 rounded-lg flex gap-6 items-center">
                <div className="bg-blue-100 p-4 rounded-lg">
                  <FaTruck className="text-2xl text-blue-600" />
                </div>
                <div>
                  <h2 className="font-bold">your Package is on its way!</h2>
                  <p className="font-bold text-sm text-muted">
                    Your delivery partner is bringing your order.
                  </p>
                </div>
              </div>
            </div>
            {/* Tracking section */}
            <div className="border border-gray-300 h-40 rounded-md mt-10">
              <h1>Delivery Progress</h1>
            </div>
            {/* order and Address Details */}
            <div className="border border-gray-300 mt-10 flex px-8 py-5 gap-5">
              <div className="w-[70%] border py-4 px-6 border-gray-300 rounded-lg">
                <div className="flex gap-3 items-center">
                  <AiOutlineInbox className="text-3xl text-blue-600 bg-blue-200 p-1 rounded-lg" />
                  <h1>Order Items</h1>
                </div>
                <div className="mt-6">
                  <div className="w-full rounded-lg h-50 bg-gray-200">
                    <img src="" alt={order.product.name} />
                  </div>
                  <div className="mt-6 flex flex-col gap-3">
                    <p className="text-xl font-bold">{order.product.name}</p>
                    <p className="text-muted text-sm font-bold">
                      Quantity :
                      <span className="font-bold text-black">
                        {" "}
                        {order.product.quantity}
                      </span>
                    </p>
                    <p className="text-lg font-bold flex justify-end w-full text-blue-600">
                      ${order.product.price}
                    </p>
                  </div>
                </div>
              </div>
              <div className="w-[30%] border border-gray-300 p-5 rounded-lg flex flex-col justify-between bg-white">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                    <div className="flex gap-2.5 items-center">
                      <IoLocationOutline className="text-3xl text-blue-600 bg-blue-100 p-1.5 rounded-lg" />
                      <h1 className="font-bold text-gray-800">Deliver to</h1>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      Home
                    </span>
                  </div>

                  <div className="mt-8 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
                      {order?.address?.customerName
                        ? order.address.customerName.charAt(0).toUpperCase()
                        : "U"}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">
                        {order.address.customerName}
                      </p>
                      <p className="text-xs text-muted font-semibold flex items-center gap-1 mt-0.5">
                        <IoCallOutline className="text-blue-500" /> +91 98765
                        43210
                      </p>
                    </div>
                  </div>

                  <div className="mt-12 p-3.5 bg-gray-50 border border-gray-200 rounded-lg space-y-1">
                    <p className="text-gray-800 font-semibold text-sm">
                      {order.address.street}
                    </p>
                    <p className="text-gray-600 text-xs font-medium">
                      {order.address.city}, {order.address.state} -{" "}
                      <span className="font-bold text-gray-800">
                        {order.address.postalCode}
                      </span>
                    </p>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      {order.address.country}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-muted font-semibold">
                  <span>Shipping Type</span>
                  <span className="text-gray-800 font-bold">
                    Standard Delivery
                  </span>
                </div>
              </div>
            </div>
            <div className="border border-gray-300 mt-10  px-3 py-5 gap-5 rounded-lg">
              <div className="flex gap-5 items-center">
                <p className="bg-blue-100 p-1 rounded-lg">
                  <MdOutlineCreditCard className="text-2xl text-blue-600" />
                </p>
                <h1 className="text-lg font-bold">Payment Summary</h1>
              </div>
              <div className="mt-10 flex flex-col gap-3">
                <div className="flex justify-between">
                  <p>Subtotal</p>
                  <p className="text-gray-800 font-bold">$19000.00</p>
                </div>
                <div className="flex justify-between">
                  <p>Shipping</p>
                  <p className="text-green-600 font-bold">Free</p>
                </div>
                <hr className="border border-gray-300 my-1.5"></hr>
                <div className="flex flex-col gap-5">
                  <div className="flex justify-between">
                    <p className="font-semibold">Total Amount</p>
                    <p className="text-xl font-bold">$19000.00</p>
                  </div>
                  <p className="text-xs font-bold text-muted">
                    Payment method: {order.paymentMethod}
                  </p>
                  <div className="flex justify-between">
                    <p className="text-xs font-bold text-muted">
                      Payment status
                    </p>
                    <p className="bg-green-300 text-xs py-1 px-2 text-muted font-bold rounded-lg">
                      paid
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="border border-gray-50">
              <div className="flex justify-between mt-10">
                <button className="border border-gray-300 px-4 py-2 rounded-lg">
                  Download Invoice
                </button>
                <Button>Buy Again</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
