import React, { useState } from "react";
import RevenueChart from "../componenets/charts/revenueCharts";
import OrdersChart from "../componenets/charts/ordersChart";

const DashBoard = () => {
  const [revenueData, setRevenueData] = useState([
    {
      id: 1,
      name: "Total Sales",
      value: "$1000",
      percentage: "20%",
      status: "3.2%",
      description: "Increased by 1,836 since last period",
    },
    {
      id: 2,
      name: "Total Order",
      value: "$1000",
      status: "+12%",
      percentage: "20%",
      description: "Increased by 1,056 since last period",
    },
    {
      id: 3,
      name: "Average Order value",
      value: "$1000",
      status: "-0.6%",
      percentage: "20%",
      description: "Decreased by 436 since last period",
    },
  ]);
  return (
    <>
      <div className="grid grid-cols-3 gap-8">
        {revenueData.map((data) => (
          <div className="py-8 px-4 border border-gray-300 rounded-xl flex flex-col gap-5">
            <div className="flex justify-between">
              <h1 className="font-bold text-lg">{data.name}</h1>
              <p>icon</p>
            </div>
            <div className="flex justify-between">
              <p>{data.value}</p>
              <p className="bg-green-300 p-1 rounded-lg text-xs font-bold">
                {data.status}
              </p>
            </div>
            <p className="font-semibold text-gray-500">{data.description}</p>
          </div>
        ))}
      </div>
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 mt-4 gap-5">
        <RevenueChart />
        <OrdersChart />
      </div>
     
    </>
  );
};

export default DashBoard;
