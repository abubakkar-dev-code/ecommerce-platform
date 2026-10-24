import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const revenueData = [
  { day: "Mon", revenue: 12000 },
  { day: "Tue", revenue: 18000 },
  { day: "Wed", revenue: 14500 },
  { day: "Thu", revenue: 24000 },
  { day: "Fri", revenue: 21000 },
  { day: "Sat", revenue: 32000 },
  { day: "Sun", revenue: 28000 },
];

const RevenueChart = () => {
  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white p-5 min-w-0 h-96">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800">Sales Revenue</h2>
        <p className="mt-1 text-sm text-gray-500">
          Daily revenue for the last 7 days
        </p>
      </div>
      <div className="w-full">
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart
            data={revenueData}
            margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e2e8f0"
              vertical={false}
            />
            <XAxis
              dataKey="day"
              tick={{ fill: "#64748b", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickMargin={12}
            />
            <YAxis
              tickFormatter={(value) => `₹${value / 1000}k`}
              tick={{ fill: "#64748b", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={55}
            />
            <Tooltip
              formatter={(value) => [
                `₹${Number(value).toLocaleString("en-IN")}`,
                "Revenue",
              ]}
              contentStyle={{
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#2563eb"
              strokeWidth={2.5}
              fill="url(#revenueGradient)"
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
export default RevenueChart;
