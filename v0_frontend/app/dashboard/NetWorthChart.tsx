import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import ApiService from "../utilities/apiService";

const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatAxisDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const prevValue = payload[0].payload.previousValue;
    const change = payload[0].payload.change || value - prevValue;
    const percentChange =
      prevValue !== 0
        ? ((change / Math.abs(prevValue)) * 100).toFixed(1)
        : change > 0
        ? "100"
        : "0";
    const date = formatDate(label);

    return (
      <div className="bg-white rounded-lg shadow-lg p-3 border border-gray-100">
        <div className="text-sm text-gray-500">{date}</div>
        <div className="text-lg font-semibold mt-1">
          {formatCurrency(value)}
        </div>
        <div
          className={`text-sm mt-1 ${
            change >= 0 ? "text-green-500" : "text-red-500"
          }`}
        >
          {change >= 0 ? "+" : ""}
          {formatCurrency(change)} ({change >= 0 ? "+" : ""}
          {percentChange}%)
        </div>
      </div>
    );
  }
  return null;
};

const CustomXAxisTick = ({ x, y, payload, first, last }) => {
  if (!first && !last) return null;

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={16}
        textAnchor={first ? "start" : "end"}
        fill="#9CA3AF"
        fontSize="12"
      >
        {formatAxisDate(payload.value)}
      </text>
    </g>
  );
};

const NetWorthChart = ({ data = [], timeframe = "1M" }) => {
  if (!data || data.length === 0) {
    return (
      <div className="w-full bg-white rounded-xl p-6 shadow-sm">
        <div className="mb-6">
          <div className="font-semibold">Net Worth</div>
          <h2 className="text-2xl font-semibold">{formatCurrency(0)}</h2>
          <div className="text-gray-500">No data available</div>
        </div>
      </div>
    );
  }

  const latestValue = data[data.length - 1]?.value || 0;
  const previousValue = data[data.length - 2]?.value || latestValue;
  const monthChange = latestValue - previousValue;
  const monthPercentChange =
    previousValue !== 0
      ? ((monthChange / Math.abs(previousValue)) * 100).toFixed(1)
      : monthChange > 0
      ? "100"
      : "0";

  const chartData = data.map((item) => ({
    ...item,
    previousValue: item.previousValue || 0,
  }));

  return (
    <div className="w-full bg-white rounded-xl p-6 shadow-sm">
      <div className="mb-6">
        <div className="font-semibold">Net Worth</div>
        <h2 className="text-2xl font-semibold">
          {formatCurrency(latestValue)}
        </h2>
        <div
          className={`text-sm ${
            monthChange >= 0 ? "text-green-500" : "text-red-500"
          }`}
        >
          {monthChange >= 0 ? "+" : ""}
          {formatCurrency(monthChange)} ({monthChange >= 0 ? "+" : ""}
          {monthPercentChange}%)
        </div>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <XAxis
              dataKey="date"
              tickFormatter={formatAxisDate}
              tick={({ x, y, payload, index }) => (
                <CustomXAxisTick
                  x={x}
                  y={y}
                  payload={payload}
                  first={index === 0}
                  last={index === chartData.length - 1}
                />
              )}
            />
            <YAxis
              tickFormatter={formatCurrency}
              width={80}
              tick={{ fill: "#9CA3AF" }}
            />
            <Tooltip
              content={
                <CustomTooltip
                  active={undefined}
                  payload={undefined}
                  label={undefined}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#6366F1"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Example usage with sample data
const DashboardChart = () => {
  const [sampleData, setData] = useState([]);

  useEffect(() => {
    ApiService.get("/api/dashboard/networth").then((response) => {
      console.log(response);
      setData(response);
    });
  }, []);

  return (
    <div className="max-w-4xl">
      <NetWorthChart data={sampleData} />
    </div>
  );
};

export default DashboardChart;
