"use client";
import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Label,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// const incomeData = [
//   { accountName: "Bank A", amount: 7514.22 },
//   { accountName: "Bank B", amount: 387.11 },
//   { accountName: "Investment Firm", amount: 509.78 },
// ];

// const expensesData = [
//   { accountName: "Bank A", amount: 5844.11 },
//   { accountName: "Bank B", amount: 124.81 },
//   { accountName: "Credit Card", amount: 143.32 },
// ];

const CustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  index,
  accountName,
  amount,
}) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius * 1.2; // Increase radius to position label further
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#666"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="text-sm"
    >
      {`${accountName}: $${amount.toLocaleString()}`}
    </text>
  );
};

const DonutChart = ({ data, COLORS }) => (
  <ResponsiveContainer width="100%" height={220}>
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        innerRadius={60}
        outerRadius={80}
        fill="#8884d8"
        paddingAngle={5}
        dataKey="amount"
        nameKey="accountName"
        label={CustomLabel}
        labelLine={true}
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip formatter={(amount) => `$${amount.toLocaleString()}`} />
    </PieChart>
  </ResponsiveContainer>
);

export default function IncomeExpensesDonutCharts({
  incomeData,
  expensesData,
}) {
  const getColors = () => {
    const colors = [];
    const len = incomeData.length;
    for (let i = 0; i < len; i++) {
      const color = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
      colors.push(color);
    }
    return colors;
  };

  const COLORS = getColors();
  return (
    <Card className="col-span-1">
      <CardHeader className="pb-4">
        <CardTitle>Income & Expenses by Institution</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="income" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
          </TabsList>
          <TabsContent value="income">
            <DonutChart data={incomeData} COLORS={COLORS} />
            <div className="mt-2 flex items-center justify-center">
              <div className="text-center">
                <span className="text-xl font-bold">
                  $
                  {incomeData
                    .reduce((sum, item) => sum + item.amount, 0)
                    .toFixed(2)}
                </span>
                <p className="text-sm text-muted-foreground">Total Income</p>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="expenses">
            <DonutChart data={expensesData} COLORS={COLORS} />
            <div className="mt-2 flex items-center justify-center">
              <div className="text-center">
                <span className="text-xl font-bold">
                  $
                  {expensesData
                    .reduce((sum, item) => sum + item.amount, 0)
                    .toFixed(2)}
                </span>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
