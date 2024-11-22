"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownRight, Search } from "lucide-react";
import { GetTransactionservice } from "./transactionService";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import TransactionChart from "./transactionChart";

// TransactionFilters component
const TransactionFilters = ({ onFilterChange, onSortChange }) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search transactions"
          className="w-full sm:w-auto"
          onChange={(e) => onFilterChange(e.target.value)}
        />
        <Button variant="outline" size="icon">
          <Search className="h-4 w-4" />
        </Button>
      </div>
      <Select onValueChange={onSortChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="date-desc">Date (Newest first)</SelectItem>
          <SelectItem value="date-asc">Date (Oldest first)</SelectItem>
          <SelectItem value="amount-desc">Amount (Highest first)</SelectItem>
          <SelectItem value="amount-asc">Amount (Lowest first)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

// TransactionItem component
const TransactionItem = ({ transaction }) => {
  return (
    <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-4">
        <div
          className={`p-2 rounded-full ${
            transaction.amount > 0 ? "bg-green-100" : "bg-red-100"
          }`}
        >
          {transaction.amount > 0 ? (
            <ArrowDownRight className="h-4 w-4 text-green-600" />
          ) : (
            <ArrowUpRight className="h-4 w-4 text-red-600" />
          )}
        </div>
        <div>
          <div className="font-medium">{transaction.name}</div>
          <div className="text-sm text-gray-500">{transaction.date}</div>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-sm text-gray-500">
          {transaction.personal_finance_category.primary}
        </div>
        <div
          className={`font-medium ${
            transaction.amount > 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          {transaction.amount > 0 ? "+" : "-"}$
          {Math.abs(transaction.amount).toFixed(2)}
        </div>
      </div>
    </div>
  );
};

const TransactionList = ({ transactions }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = transactions.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(transactions.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="space-y-4">
      {currentTransactions.map((transaction, index) => (
        <TransactionItem
          key={transaction.id || index}
          transaction={transaction}
        />
      ))}

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            />
          </PaginationItem>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <PaginationItem key={page}>
              <PaginationLink
                onClick={() => handlePageChange(page)}
                isActive={currentPage === page}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

// TransactionSummary component
const TransactionSummary = ({ transactions }) => {
  const totalIncome = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = Math.abs(
    transactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0)
  );
  const netAmount = totalIncome - totalExpenses;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Transaction Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">
              ${totalIncome.toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">Total Income</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              ${totalExpenses.toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">Total Expenses</div>
          </div>
          <div>
            <div
              className={`text-2xl font-bold ${
                netAmount >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              ${Math.abs(netAmount).toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">Net Amount</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// TransactionChart component

// Main TransactionsPage component
export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const getTransactionService = GetTransactionservice();
  const [loading, setIsLoading] = useState(true);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  useEffect(() => {
    const uuid =
      getTransactionService.registerTransactionsListener(setTransactions);
    getTransactionService.getTransactionsList().then((response) => {
      console.log(
        "In transactions page.tsx , latest transactions fetched",
        response
      );
      setTransactions(response);
      setFilteredTransactions(response);
      setIsLoading(false);
    });

    return () => {
      getTransactionService.unregisterTransactionsListener(setTransactions);
    };
  }, []);

  const handleFilterChange = (searchTerm) => {
    const filtered = transactions.filter(
      (transaction) =>
        transaction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.personal_finance_category.primary
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    );
    setFilteredTransactions(filtered);
  };

  const handleSortChange = (sortOption) => {
    const sorted = [...filteredTransactions];
    switch (sortOption) {
      case "date-desc":
        sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case "date-asc":
        sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case "amount-desc":
        sorted.sort((a, b) => b.amount - a.amount);
        break;
      case "amount-asc":
        sorted.sort((a, b) => a.amount - b.amount);
        break;
      default:
        break;
    }
    setFilteredTransactions(sorted);
  };

  return (
    <div className="container flex flex-col mx-auto p-6 h-screen overflow-auto">
      <h1 className="text-3xl font-bold mb-6">Transactions</h1>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <TransactionSummary transactions={filteredTransactions} />
          <TransactionChart transactions={transactions} />
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionFilters
                onFilterChange={handleFilterChange}
                onSortChange={handleSortChange}
              />
              <TransactionList transactions={filteredTransactions} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
