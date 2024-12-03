import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";

interface TransactionData {
  category: string;
  amount: number;
}

interface FinancialData {
  categories: TransactionData[];
  total: number;
}

interface IncomeExpenseCardsProps {
  income: FinancialData;
  expenses: FinancialData;
}

const TopCategories = ({ data, type }: { data: TransactionData[], type: 'income' | 'expenses' }) => {
  const sortedData = [...data].sort((a, b) => b.amount - a.amount);
  const topThree = sortedData.slice(0, 3);
  const Icon = type === "income" ? ArrowUpCircle : ArrowDownCircle;
  const colorClass = type === "income" ? "text-green-500" : "text-red-500";

  return (
    <div className="mt-4 space-y-2">
      {topThree.map((item, index) => (
        <div
          key={item.category}
          className="flex items-center justify-between"
        >
          <div className="flex items-center">
            <Icon className={`${colorClass} mr-2 h-4 w-4`} />
            <span className="text-sm">{item.category}</span>
          </div>
          <span className="text-sm font-medium">${item.amount.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

export default function IncomeExpenseCards({ income, expenses }: IncomeExpenseCardsProps) {
  if (!income?.categories || !expenses?.categories) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-500">No data available</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Spending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-500">No data available</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Income</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <ArrowUpCircle className="text-green-500 mr-2 h-5 w-5" />
            <span className="text-2xl font-bold">
              ${income.total.toLocaleString()}
            </span>
          </div>
          <TopCategories data={income.categories} type="income" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Spending</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <ArrowDownCircle className="text-red-500 mr-2 h-5 w-5" />
            <span className="text-2xl font-bold">
              ${expenses.total.toLocaleString()}
            </span>
          </div>
          <TopCategories data={expenses.categories} type="expenses" />
        </CardContent>
      </Card>
    </div>
  );
}
