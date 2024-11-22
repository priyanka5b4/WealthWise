import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";

// const incomeData = [
//   { accountName: "Bank A", amount: 7514.22 },
//   { accountName: "Investment Firm", amount: 509.78 },
//   { accountName: "Bank B", amount: 387.11 },
//   { accountName: "Bank C", amount: 250.0 },
//   { accountName: "Bank D", amount: 150.0 },
// ];

// const expensesData = [
//   { accountName: "Bank A", amount: 5844.11 },
//   { accountName: "Credit Card", amount: 143.32 },
//   { accountName: "Bank B", amount: 124.81 },
//   { accountName: "Bank C", amount: 100.0 },
//   { accountName: "Bank D", amount: 75.0 },
// ];

const TopBanks = ({ data, type }) => {
  const sortedData = [...data].sort((a, b) => b.amount - a.amount);
  const topThree = sortedData.slice(0, 3);
  const Icon = type === "income" ? ArrowUpCircle : ArrowDownCircle;
  const colorClass = type === "income" ? "text-green-500" : "text-red-500";

  return (
    <div className="mt-4 space-y-2">
      {topThree.map((item, index) => (
        <div
          key={item.accountName}
          className="flex items-center justify-between"
        >
          <div className="flex items-center">
            <Icon className={`${colorClass} mr-2 h-4 w-4`} />
            <span className="text-sm">{item.accountName}</span>
          </div>
          <span className="text-sm font-medium">${item.amount.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
};

export default function IncomeExpenseCards({ incomeData, expensesData }) {
  const totalIncome = incomeData.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = expensesData.reduce(
    (sum, item) => sum + item.amount,
    0
  );

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
              ${totalIncome.toFixed(2)}
            </span>
          </div>
          <p className="text-sm text-green-500 mt-2">
            +$871.22 (+2.8%) vs last month
          </p>
          <TopBanks data={incomeData} type="income" />
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
              ${totalExpenses.toFixed(2)}
            </span>
          </div>
          <p className="text-sm text-red-500 mt-2">
            +$1,704.56 (+1.9%) vs last month
          </p>
          <TopBanks data={expensesData} type="expenses" />
        </CardContent>
      </Card>
    </div>
  );
}
