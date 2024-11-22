"use client";

import { useEffect, useState } from "react";
import {
  Wallet,
  CreditCard,
  PiggyBank,
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { GetAccountService } from "./accountService";
import QuickStats from "./quickStats";

// AccountIcon component
const AccountIcon = ({ type, className }) => {
  const icons = {
    checking: Wallet,
    savings: PiggyBank,
    credit: CreditCard,
  };
  const Icon = icons[type] || Wallet;
  return <Icon className={className} />;
};

const AccountColor = (type: string) => {
  const colors = {
    checking: "bg-blue-500",
    savings: "bg-green-500",
    credit: "bg-purple-500",
  };
  const color = colors[type] || "bg-gray-500";
  return color;
};

// AccountHeader component
const AccountHeader = ({ account }) => {
  return (
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <div className="flex items-center space-x-2">
        <div className={`p-2 rounded-full ${AccountColor(account.type)}`}>
          <AccountIcon type={account.type} className="h-4 w-4 text-white" />
        </div>
        <div>
          <CardTitle>{account.name}</CardTitle>
          <CardDescription>
            {account.institution.institution_name} {"****"}
            {account.number}
          </CardDescription>
        </div>
      </div>
    </CardHeader>
  );
};

// AccountBalance component
const AccountBalance = ({ balance, change }) => {
  return (
    <div>
      <div className="text-2xl font-bold">
        ${Math.abs(balance).toLocaleString()}
      </div>
      <p
        className={`text-sm ${change >= 0 ? "text-green-600" : "text-red-600"}`}
      >
        {Math.abs(change).toFixed(2)} avg transaction amount.
      </p>
    </div>
  );
};

// AccountDetails component
const AccountDetails = ({ account }) => {
  const renderDetails = () => {
    switch (account.type) {
      case "checking":
        return (
          <>
            <DetailItem
              label="Income"
              value={`${account.statistics.total.income}`}
            />
            <DetailItem
              label="Spending"
              value={`$${account.statistics.total.expenses}`}
            />
            {account.statistics.lastTransaction && (
              <DetailItem
                label="Last Updated Transaction Date"
                value={`${account.statistics.lastTransaction.date}`}
              />
            )}
            {account.statistics.lastTransaction && (
              <DetailItem
                label="Last Updated Transaction Amount"
                value={`$${account.statistics.lastTransaction.amount}`}
              />
            )}
          </>
        );
      case "savings":
        return (
          <>
            <DetailItem
              label="Income"
              value={`${account.statistics.total.income}`}
            />
            <DetailItem
              label="Spending"
              value={`$${account.statistics.total.expenses}`}
            />
            {account.statistics.lastTransaction && (
              <DetailItem
                label="Last Updated Transaction Date"
                value={`${account.statistics.lastTransaction.date}`}
              />
            )}
            {account.statistics.lastTransaction && (
              <DetailItem
                label="Last Updated Transaction Amount"
                value={`$${account.statistics.lastTransaction.amount}`}
              />
            )}
          </>
        );
      case "credit":
        return (
          <>
            <DetailItem
              label="Credit Limit"
              value={`$${account.balances.limit}`}
            />
            <DetailItem
              label="Income"
              value={`${account.statistics.total.income}`}
            />
            <DetailItem
              label="Spending"
              value={`$${account.statistics.total.expenses}`}
            />
            {account.statistics.lastTransaction && (
              <DetailItem
                label="Last Updated Transaction Date"
                value={`${account.statistics.lastTransaction.date}`}
              />
            )}
            {account.statistics.lastTransaction && (
              <DetailItem
                label="Last Updated Transaction Amount"
                value={`$${account.statistics.lastTransaction.amount}`}
              />
            )}
          </>
        );
      default:
        return null;
    }
  };

  return <div className="space-y-2">{renderDetails()}</div>;
};

// DetailItem component
const DetailItem = ({ label, value }) => (
  <div className="flex justify-between">
    <span className="text-sm text-gray-500">{label}:</span>
    <span className="text-sm font-medium">{value}</span>
  </div>
);

// ProgressBar component
const ProgressBar = ({ label, value }) => (
  <div className="mt-2">
    <div className="flex justify-between mb-1">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium">{Math.round(value)}%</span>
    </div>
    <Progress value={value} className="w-full" />
  </div>
);

// AccountCard component
const AccountCard = ({ account }) => {
  // const [selectedPeriod, setSelectedPeriod] = useState("This Month");

  return (
    <Card>
      <AccountHeader account={account} />
      <CardContent>
        <AccountBalance
          balance={account.balances.available}
          change={account.statistics.transactions.averageAmount}
        />
        <div className="mt-4">
          <Tabs defaultValue="details">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Account Details</TabsTrigger>
              <TabsTrigger value="quickstats">Quick Stats</TabsTrigger>
            </TabsList>
            <TabsContent value="details">
              <AccountDetails account={account} />
            </TabsContent>
            <TabsContent value="quickstats">
              <QuickStats stats={account.statistics} type={account.type} />
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
      {/* <CardFooter>
        <Button variant="outline" className="w-full">
          Manage Account
        </Button>
      </CardFooter> */}
    </Card>
  );
};

// AccountsPage component
export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const accountService = GetAccountService();
  useEffect(() => {
    const uuid = accountService.registeraccountsListener(setAccounts);
    accountService.getAccountsList().then((response) => {
      console.log("New accounts fetched", response);
      setAccounts(response);
    });
    return () => {
      accountService.unregisteraccountsListener(uuid);
    };
  }, []);

  return (
    <div className="container mx-auto p-6 h-screen overflow-auto">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Accounts</h1>
          <p className="text-gray-500">Details about added accounts</p>
        </div>
        {/* <Button>
          <Plus className="mr-2 h-4 w-4" /> Add New Account
        </Button> */}
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account, index) => (
          <AccountCard key={index} account={account} />
        ))}
      </div>
    </div>
  );
}
