"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Wallet,
  Receipt,
  Plus,
  ChevronDown,
  MoreHorizontal,
  Bell,
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
import Sidebar from "./sidebar";
import { GetAccountService } from "../accounts/accountService";
import NetWorthChart from "./NetWorthChart";
import IncomeExpenseCards from "./incomeExpenseCard";
import RecentTransactions from "./recentTranscations";
import DonutChart from "./donutChart";
import CategorySpending from "./CategorySpending";
import ApiService from "../utilities/apiService";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

const Header = () => {
  const today = new Date();
  const timeOfDay = () => {
    const hour = today.getHours();
    if (hour < 12) return "Morning";
    if (hour < 17) return "Afternoon";
    return "Evening";
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-white/50 backdrop-blur-sm p-6 rounded-xl shadow-sm sticky top-0 z-10">
      <div>
        <h1 className="text-2xl font-semibold">
          {timeOfDay()}, <span className="text-primary">Priyanka</span>
        </h1>
        <p className="text-gray-500">
          {today.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="icon"
          className="relative hover:bg-primary/10 transition-colors"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full animate-pulse" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="hover:bg-primary/10">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">Profile</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">Settings</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">Support</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

interface TransactionData {
  category: string;
  amount: number;
}

interface FinancialData {
  categories: TransactionData[];
  total: number;
}

interface IncomeExpensesType {
  income: FinancialData;
  expenses: FinancialData;
  summary: {
    netIncome: number;
    savingsRate: number;
  };
}

const LoadingCard = () => (
  <Card className="p-6">
    <CardHeader className="p-0 mb-6">
      <Skeleton className="h-6 w-48" />
    </CardHeader>
    <CardContent className="p-0">
      <Skeleton className="h-[200px] w-full" />
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const [financialData, setFinancialData] = useState<IncomeExpensesType>({
    income: { categories: [], total: 0 },
    expenses: { categories: [], total: 0 },
    summary: { netIncome: 0, savingsRate: 0 }
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState("thisMonth");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await ApiService.get("/api/dashboard/IncomeExpenses");
        setFinancialData(response);
      } catch (error) {
        console.error("Error fetching financial data:", error);
        toast({
          title: "Error",
          description: "Failed to load financial data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="p-6 space-y-6 h-screen overflow-y-auto">
        <Header />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isLoading ? (
            <>
              <LoadingCard />
              <LoadingCard />
            </>
          ) : (
            <>
              <Card className="p-6 hover:shadow-md transition-shadow">
                <CardHeader className="p-0 mb-6">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <span className="text-primary">Net Worth</span>
                    <span className="text-sm font-normal text-gray-500">Last 12 months</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <NetWorthChart />
                </CardContent>
              </Card>

              <Card className="p-6 hover:shadow-md transition-shadow">
                <CardHeader className="p-0 mb-6">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <span className="text-primary">Income vs Expenses</span>
                    <span className="text-sm font-normal text-gray-500">This month</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <DonutChart
                    income={financialData.income}
                    expenses={financialData.expenses}
                  />
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {isLoading ? (
          <LoadingCard />
        ) : (
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <IncomeExpenseCards
                income={financialData.income}
                expenses={financialData.expenses}
              />
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="p-6 pb-0">
              <CardTitle className="text-lg font-semibold flex items-center justify-between">
                <span className="text-primary">Recent Transactions</span>
                <Button variant="outline" size="sm" className="hover:bg-primary/10">
                  View All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <RecentTransactions />
            </CardContent>
          </Card>

          <div className="hover:shadow-md transition-shadow">
            <CategorySpending />
          </div>
        </div>
      </div>
    </div>
  );
}
