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
    const change = value - prevValue;
    const percentChange = ((change / prevValue) * 100).toFixed(1);
    const date = formatDate(label);

    return (
      <div className="bg-white rounded-lg shadow-lg p-3 border border-gray-100">
        <div className="text-sm text-gray-500">{date}</div>
        <div className="text-lg font-semibold mt-1">
          {formatCurrency(value)}
          <span className="text-sm font-normal text-gray-400 ml-1">
            .{(value % 1).toFixed(2).split(".")[1]}
          </span>
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

const NetWorthChart = ({ data, timeframe = "1M" }) => {
  const [hoveredData, setHoveredData] = useState(null);

  const latestValue = data[data.length - 1]?.value || 0;
  const previousValue = data[data.length - 2]?.value || 0;
  const monthChange = latestValue - previousValue;
  const monthPercentChange = ((monthChange / previousValue) * 100).toFixed(1);

  return (
    <div className="w-full bg-white rounded-xl p-6 shadow-sm">
      <div className="mb-6">
        <div className="font-semibold">Net Worth</div>
        <h2 className="text-2xl font-semibold">
          {formatCurrency(latestValue)}
          <span className="text-base font-normal text-gray-400 ml-1">
            .{(latestValue % 1).toFixed(2).split(".")[1]}
          </span>
        </h2>
        <p
          className={`text-sm ${
            monthChange >= 0 ? "text-green-500" : "text-red-500"
          }`}
        >
          {monthChange >= 0 ? "+" : ""}
          {formatCurrency(monthChange)} ({monthChange >= 0 ? "+" : ""}
          {monthPercentChange}%) vs last month
        </p>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
            onMouseMove={(e) => {
              if (e?.activePayload) {
                setHoveredData(e.activePayload[0]?.payload);
              }
            }}
            onMouseLeave={() => setHoveredData(null)}
          >
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={(props) => (
                <CustomXAxisTick
                  {...props}
                  first={props.index === 0}
                  last={props.index === data.length - 1}
                />
              )}
              interval={0}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={false}
              domain={["auto", "auto"]}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: "#10B981",
                strokeWidth: 1,
                strokeDasharray: "5 5",
              }}
            />
            <Line
              type="linear"
              dataKey="value"
              stroke="#10B981"
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 6,
                stroke: "#10B981",
                strokeWidth: 2,
                fill: "#FFFFFF",
              }}
              fill="url(#colorValue)"
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
