"use client";

import { useState, useEffect } from "react";
import {
  Search,
  LayoutDashboard,
  Wallet,
  Receipt,
  Plus,
  ChevronDown,
  MoreHorizontal,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import Sidebar from "./sidebar";
import { GetAccountService } from "../accounts/accountService";
import DashboardChart from "./NetWorthChart";
import NetWorthChart from "./NetWorthChart";
import IncomeExpenseCards from "./incomeExpenseCard";
import RecentTransactions from "./recentTranscations";
import DonutChart from "./donutChart";
import CategorySpending from "./CategorySpending";
import ApiService from "../utilities/apiService";

const Header = () => (
  <div className="flex justify-between items-start mb-8">
    <div>
      <h1 className="text-2xl font-semibold">Morning, Priyanka</h1>
      <p className="text-gray-500">Monday, Feb 5</p>
    </div>
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="icon">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </div>
  </div>
);
interface IncomeExpensesType {
  income: any[];
  expenses: any[];
}

export default function Dashboard() {
  const [IncomeExpenses, setIncomeExpenses] = useState<IncomeExpensesType>({
    income: [],
    expenses: [],
  });

  useEffect(() => {
    ApiService.get("/api/dashboard/IncomeExpenses").then((response) => {
      console.log("response", response);
      setIncomeExpenses(response);
    });
  }, []);

  return (
    <div className="p-6 space-y-6 h-screen overflow-auto">
      <h1 className="text-3xl font-bold mb-6">Financial Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <NetWorthChart />
        {IncomeExpenses && (
          <DonutChart
            incomeData={IncomeExpenses.income}
            expensesData={IncomeExpenses.expenses}
          />
        )}
      </div>
      {IncomeExpenses && (
        <IncomeExpenseCards
          incomeData={IncomeExpenses.income}
          expensesData={IncomeExpenses.expenses}
        />
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RecentTransactions />
        <CategorySpending />
      </div>
    </div>
  );
}
