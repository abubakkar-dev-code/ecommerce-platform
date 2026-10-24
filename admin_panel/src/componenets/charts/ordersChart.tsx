import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  CartesianGrid,
  Tooltip,
} from "recharts";

const ordersChart = () => {
  const OrdersData = [
    { day: "Mon", orders: 24 },
    { day: "Tue", orders: 38 },
    { day: "Wed", orders: 31 },
    { day: "Thu", orders: 45 },
    { day: "Fri", orders: 52 },
    { day: "Sat", orders: 68 },
    { day: "Sun", orders: 57 },
  ];
  return (
    <div className="w-full bg-white border-gray-200 p-5 min-w-0 h-96 rounded-xl">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800">Total Orders</h2>
        <p className="mt-1 text-sm text-gray-500">
          Daily total orders for the last 7 days
        </p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={OrdersData}>
          <XAxis dataKey="day" />
          <YAxis />
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip />
          <Bar dataKey="orders" fill="#8884d8" barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ordersChart;
