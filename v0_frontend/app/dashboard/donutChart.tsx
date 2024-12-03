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

interface TransactionData {
  category: string;
  amount: number;
}

interface FinancialData {
  categories: TransactionData[];
  total: number;
}

interface DonutChartProps {
  income: FinancialData;
  expenses: FinancialData;
}

const CustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  index,
  category,
  amount,
}) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius * 1.2;
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
      {`${category}: $${amount.toLocaleString()}`}
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
        nameKey="category"
        label={CustomLabel}
        labelLine={true}
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip 
        formatter={(amount) => `$${amount.toLocaleString()}`}
        labelFormatter={(category) => category}
      />
    </PieChart>
  </ResponsiveContainer>
);

export default function IncomeExpensesDonutCharts({
  income,
  expenses,
}: DonutChartProps) {
  if (!income?.categories || !expenses?.categories) {
    return (
      <Card className="col-span-1">
        <CardHeader className="pb-4">
          <CardTitle>Income & Expenses by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">No data available</div>
        </CardContent>
      </Card>
    );
  }

  const getColors = (data) => {
    const colors = [];
    const len = data.length;
    for (let i = 0; i < len; i++) {
      const hue = (i * 360) / len;
      colors.push(`hsl(${hue}, 70%, 50%)`);
    }
    return colors;
  };

  const incomeColors = getColors(income.categories);
  const expenseColors = getColors(expenses.categories);

  return (
    <Card className="col-span-1">
      <CardHeader className="pb-4">
        <CardTitle>Income & Expenses by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="income" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
          </TabsList>
          <TabsContent value="income">
            <DonutChart data={income.categories} COLORS={incomeColors} />
            <div className="mt-2 flex items-center justify-center">
              <div className="text-center">
                <span className="text-xl font-bold">
                  ${income.total.toLocaleString()}
                </span>
                <p className="text-sm text-muted-foreground">Total Income</p>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="expenses">
            <DonutChart data={expenses.categories} COLORS={expenseColors} />
            <div className="mt-2 flex items-center justify-center">
              <div className="text-center">
                <span className="text-xl font-bold">
                  ${expenses.total.toLocaleString()}
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
