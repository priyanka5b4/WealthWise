"use cleint";
import { useState, useEffect } from "react";
import {
  Building2,
  Briefcase,
  CreditCard,
  Wallet,
  Bank,
  HelpCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GetTransactionservice } from "../transactions/transactionService";
import Image from "next/image";
import Link from "next/link";
// Account type color and icon mapping
export const AccountTypeConfig = {
  INVESTMENT: {
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    icon: Briefcase,
  },
  CREDIT: {
    color: "text-red-600",
    bgColor: "bg-red-100",
    icon: CreditCard,
  },
  DEPOSITORY: {
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    icon: Bank,
  },
  LOAN: {
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    icon: Building2,
  },
  BROKERAGE: {
    color: "text-green-600",
    bgColor: "bg-green-100",
    icon: Wallet,
  },
  OTHER: {
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    icon: Wallet,
  },
};

// Helper functions
const getAccountTypeConfig = (Transactiontype: string) => {
  const normalizedType = Transactiontype.toUpperCase();
  return AccountTypeConfig[normalizedType] || AccountTypeConfig.OTHER;
};

// Usage in component
export default function RecentTransactions() {
  const [transactions, setTransactions] = useState([]);
  const TransactionService = GetTransactionservice();

  useEffect(() => {
    const uuid =
      TransactionService.registerTransactionsListener(setTransactions);
    TransactionService.getTransactionsList().then((response) => {
      const recentTransactions = response.slice(0, 10);
      setTransactions(recentTransactions);
    });
    return () => {
      TransactionService.unregisterTransactionsListener(uuid);
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 h-64 w-124 p-4 overflow-auto">
          {transactions.length > 0 &&
            transactions.map((transaction, i) => {
              const config = getAccountTypeConfig(transaction.transaction_type);

              return (
                <div key={i} className="flex items-center">
                  <div className={`${transaction.color} p-2 rounded-full mr-4`}>
                    {transaction.personal_finance_category_icon_url ? (
                      <div className={`${transaction.color} p-2 rounded-full`}>
                        <Image
                          src={transaction.personal_finance_category_icon_url}
                          alt={
                            transaction.personal_finance_category?.primary ||
                            "Transaction category"
                          }
                          width={18}
                          height={18}
                          className={`${config.color}`}
                        />
                      </div>
                    ) : (
                      <div className={`${config.bgColor} p-2 rounded-full`}>
                        <config.icon className={`${config.color} h-4 w-4`} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{transaction.name}</p>
                    <p className="text-xs text-gray-500">
                      {transaction.transaction_type}
                    </p>
                  </div>
                  <div className="flex-1 text-right">
                    <div
                      className={`text-sm font-medium ${
                        transaction.amount > 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {transaction.amount > 0 ? "+" : ""}
                      {transaction.amount.toFixed(2)}
                    </div>
                    <p className="text-xs">{transaction.authorized_date}</p>
                  </div>
                </div>
              );
            })}
        </div>
      </CardContent>
      <CardFooter>
        <div className="text-gray-500 text-xs">
          <Link href={"./transactions"}>View All Transactions</Link>
        </div>
      </CardFooter>
    </Card>
  );
}