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
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { format } from "date-fns";

// TransactionFilters component
const TransactionFilters = ({
  onFilterChange,
  onSortChange,
  searchTerm,
  onClearSearch,
  selectedCategory,
  onCategoryChange,
  categories,
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
        <div className="relative w-full sm:w-auto">
          <Input
            placeholder="Search transactions"
            className="pr-8"
            value={searchTerm}
            onChange={(e) => onFilterChange(e.target.value)}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
              onClick={onClearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
  // Format the date
  const formatTransactionDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "MMM d, yyyy 'at' h:mm a");
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString; // Return original string if formatting fails
    }
  };

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
          <div className="text-sm text-gray-500">
            {formatTransactionDate(transaction.datetime || transaction.date)}
          </div>
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
              onClick={() => {
                if (currentPage > 1) {
                  handlePageChange(currentPage - 1);
                }
              }}
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
              onClick={() => {
                if (currentPage < totalPages) {
                  handlePageChange(currentPage + 1);
                }
              }}
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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState([]);

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
    setSearchTerm(searchTerm);
  };

  const handleClearSearch = () => {
    setFilteredTransactions(transactions);
    setSearchTerm("");
  };

  const handleSortChange = (sortOption) => {
    const sorted = [...filteredTransactions];
    switch (sortOption) {
      case "date-desc":
        sorted.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        break;
      case "date-asc":
        sorted.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
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

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    if (category === "all") {
      setFilteredTransactions(transactions);
    } else {
      const filtered = transactions.filter(
        (transaction) =>
          transaction.personal_finance_category.primary === category
      );
      setFilteredTransactions(filtered);
    }
  };

  useEffect(() => {
    const categories = Array.from(
      new Set(transactions.map((t) => t.personal_finance_category.primary))
    );
    setCategories(categories);
  }, [transactions]);

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
                searchTerm={searchTerm}
                onClearSearch={handleClearSearch}
                selectedCategory={selectedCategory}
                onCategoryChange={handleCategoryChange}
                categories={categories}
              />
              <TransactionList transactions={filteredTransactions} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
