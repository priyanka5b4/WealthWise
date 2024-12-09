"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Wallet,
  CreditCard,
  PiggyBank,
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Trash2,
  Loader2,
  RotateCw,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { GetAccountService } from "./accountService";
import QuickStats from "./quickStats";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Account, AccountStatus, AccountType } from "../types/account";
import { useRouter } from "next/navigation";

// Add loading state interface
interface AccountCardProps {
  account: Account;
  onDeleted: () => Promise<void>;
}

// Add loading spinner component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center w-full h-24">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

// Utility functions
const formatAccountType = (type: string | null) => {
  if (!type) return "Unknown";
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const AccountIcon = ({
  type,
  className,
}: {
  type: AccountType;
  className?: string;
}) => {
  const icons = {
    depository: Wallet,
    credit: CreditCard,
    loan: DollarSign,
    investment: TrendingUp,
    other: Wallet,
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
  return colors[type] || "bg-gray-500";
};

// AccountHeader component
const AccountHeader = ({ account }: { account: Account }) => {
  const getStatusColor = (status: AccountStatus) => {
    switch (status) {
      case "active":
        return "text-green-500";
      case "inactive":
        return "text-yellow-500";
      case "closed":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <CardHeader>
      <div className="flex items-center justify-between space-x-4">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-primary/5 rounded-full">
            <AccountIcon type={account.type} className="h-6 w-6" />
          </div>
          <div>
            <CardTitle>{account.name}</CardTitle>
            <CardDescription>
              {formatAccountType(account.subtype)}{" "}
              {account.mask ? ` (...${account.mask})` : ""}
            </CardDescription>
          </div>
        </div>
        <div
          className={`text-sm font-medium ${getStatusColor(account.status)}`}
        >
          {formatAccountType(account.status)}
        </div>
      </div>
      {account.institution && (
        <div className="mt-2 text-sm text-muted-foreground">
          {account.institution.name}
        </div>
      )}
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
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: account.balances.iso_currency_code || "USD",
    }).format(amount);
  };

  const renderDetails = () => {
    const stats = account.statistics?.total || { income: 0, expenses: 0 };

    switch (account.type) {
      case "depository":
        return (
          <>
            <DetailItem
              label="Available Balance"
              value={formatCurrency(account.balances.available || 0)}
            />
            <DetailItem
              label="Current Balance"
              value={formatCurrency(account.balances.current)}
            />
            <DetailItem label="Income" value={formatCurrency(stats.income)} />
            <DetailItem
              label="Expenses"
              value={formatCurrency(stats.expenses)}
            />
            {account.statistics?.lastTransaction && (
              <>
                <DetailItem
                  label="Last Transaction Date"
                  value={new Date(
                    account.statistics.lastTransaction.date
                  ).toLocaleDateString()}
                />
                <DetailItem
                  label="Last Transaction Amount"
                  value={formatCurrency(
                    account.statistics.lastTransaction.amount
                  )}
                />
              </>
            )}
          </>
        );
      case "credit":
        const utilization = account.balances.limit
          ? (account.balances.current / account.balances.limit) * 100
          : 0;

        return (
          <>
            <DetailItem
              label="Current Balance"
              value={formatCurrency(account.balances.current)}
            />
            <DetailItem
              label="Credit Limit"
              value={formatCurrency(account.balances.limit || 0)}
            />
            <DetailItem
              label="Available Credit"
              value={formatCurrency(
                (account.balances.limit || 0) - account.balances.current
              )}
            />
            <ProgressBar label="Credit Utilization" value={utilization} />
            {account.statistics?.lastTransaction && (
              <>
                <DetailItem
                  label="Last Transaction Date"
                  value={new Date(
                    account.statistics.lastTransaction.date
                  ).toLocaleDateString()}
                />
                <DetailItem
                  label="Last Transaction Amount"
                  value={formatCurrency(
                    account.statistics.lastTransaction.amount
                  )}
                />
              </>
            )}
          </>
        );
      default:
        return (
          <>
            <DetailItem
              label="Current Balance"
              value={formatCurrency(account.balances.current)}
            />
            {account.balances.available !== null && (
              <DetailItem
                label="Available Balance"
                value={formatCurrency(account.balances.available)}
              />
            )}
          </>
        );
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
const AccountCard = ({ account, onDeleted }: AccountCardProps) => {
  const accountService = GetAccountService();
  const { toast } = useToast();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      console.log("Account to delete:", account);

      if (!account || !account.account_id) {
        throw new Error("Invalid account data: Missing account ID");
      }

      await accountService.deleteAccount(account.account_id);
      setIsDeleted(true);
      toast({
        title: "Account deleted",
        description:
          "Account and its transactions have been deleted successfully.",
      });
      await onDeleted();
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      const { account: updatedAccount, transactionsUpdated } =
        await accountService.refreshAccount(account.account_id);
      toast({
        title: "Account refreshed",
        description: `Account balance and details have been updated. ${transactionsUpdated} transactions were synced.`,
      });
    } catch (error) {
      console.error("Refresh error:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to refresh account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleViewTransactions = () => {
    router.push(`/transactions?account=${account.account_id}`);
  };

  if (isDeleted) {
    return null;
  }

  const getBalanceChangeColor = () => {
    if (!account.balances.previous || account.balances.previous === 0)
      return "text-gray-600";
    const change =
      ((account.balances.current - account.balances.previous) /
        Math.abs(account.balances.previous)) *
      100;
    return change >= 0 ? "text-green-600" : "text-red-600";
  };

  const calculateBalanceChange = () => {
    if (!account.balances.previous || account.balances.previous === 0) return 0;
    return (
      ((account.balances.current - account.balances.previous) /
        Math.abs(account.balances.previous)) *
      100
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: account.balances.iso_currency_code || "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(amount || 0));
  };

  const getStatusIndicator = () => {
    const statusColors = {
      active: "bg-green-500",
      inactive: "bg-yellow-500",
      closed: "bg-red-500",
    };
    return (
      <div className="flex items-center space-x-1">
        <div
          className={`w-2 h-2 rounded-full ${
            statusColors[account.status] || "bg-gray-500"
          }`}
        />
        <span className="text-sm capitalize text-muted-foreground">
          {account.status}
        </span>
      </div>
    );
  };

  const getQuickActions = () => {
    const actions = [
      {
        label: "View Transactions",
        icon: <TrendingUp className="w-4 h-4" />,
        onClick: handleViewTransactions,
      },
      {
        label: "Refresh",
        icon: isRefreshing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <RotateCw className="w-4 h-4" />
        ),
        onClick: handleRefresh,
        disabled: isRefreshing,
      },
    ];

    return (
      <div className="flex space-x-2">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            size="sm"
            onClick={action.onClick}
            disabled={action.disabled}
            className="flex items-center space-x-1"
          >
            {action.icon}
            <span>{action.label}</span>
          </Button>
        ))}
      </div>
    );
  };

  return (
    <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg">
      <div
        className={`absolute inset-x-0 h-1 top-0 ${
          account.type === "credit"
            ? "bg-purple-500"
            : account.type === "investment"
            ? "bg-green-500"
            : "bg-blue-500"
        }`}
      />

      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-primary/5 rounded-full">
              <AccountIcon type={account.type} className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="line-clamp-1">{account.name}</CardTitle>
              <CardDescription className="flex items-center space-x-2">
                <span>{formatAccountType(account.subtype)}</span>
                {account.mask && (
                  <span className="text-muted-foreground">
                    •••• {account.mask}
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
          {getStatusIndicator()}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold tracking-tight">
                {formatCurrency(account.balances.current)}
              </div>
              <div
                className={`flex items-center space-x-1 ${getBalanceChangeColor()}`}
              >
                {calculateBalanceChange() >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">
                  {Math.abs(calculateBalanceChange()).toFixed(1)}%
                </span>
              </div>
            </div>
            {account.type === "credit" && account.balances.limit && (
              <div className="mt-2">
                <div className="flex justify-between text-sm text-muted-foreground mb-1">
                  <span>Credit Used</span>
                  <span>
                    {(
                      (account.balances.current / account.balances.limit) *
                      100
                    ).toFixed(0)}
                    %
                  </span>
                </div>
                <Progress
                  value={
                    (account.balances.current / account.balances.limit) * 100
                  }
                  className="h-2"
                />
              </div>
            )}
          </div>

          {account.statistics?.total && (
            <div className="pt-4 border-t">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Income</p>
                  <p className="text-sm font-medium text-green-600">
                    {formatCurrency(account.statistics.total.income)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expenses</p>
                  <p className="text-sm font-medium text-red-600">
                    {formatCurrency(account.statistics.total.expenses)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="block space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={handleViewTransactions}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Transactions
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RotateCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Account</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this account? This will also
                  delete all associated transactions. This action cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <div className="text-xs text-muted-foreground">
          Connected via {account.connection_type}
        </div>
      </CardFooter>
    </Card>
  );
};

// AccountsPage component
export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [groupBy, setGroupBy] = useState("none");
  const accountService = GetAccountService();
  const { toast } = useToast();

  const fetchAccounts = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await accountService.getAccountsList();
      console.log("New accounts fetched", response);
      setAccounts(response);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      toast({
        title: "Error",
        description: "Failed to fetch accounts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [accountService, toast]);

  useEffect(() => {
    fetchAccounts();
    const uuid = accountService.registeraccountsListener((updatedAccounts) => {
      console.log("Accounts updated via listener:", updatedAccounts);
      setAccounts(updatedAccounts);
      setIsLoading(false);
    });

    return () => {
      accountService.unregisteraccountsListener(uuid);
    };
  }, [accountService, fetchAccounts]);

  const handleAccountDeleted = async () => {
    await fetchAccounts();
  };

  const filteredAccounts = accounts.filter((account) => {
    if (filter === "all") return true;
    return account.type === filter;
  });

  const sortedAccounts = [...filteredAccounts].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "balance":
        return (b.balances.current || 0) - (a.balances.current || 0);
      case "type":
        return a.type.localeCompare(b.type);
      default:
        return 0;
    }
  });

  const groupedAccounts = sortedAccounts.reduce((groups, account) => {
    const key =
      groupBy === "institution"
        ? account.institution?.name || "Other"
        : groupBy === "type"
        ? account.type
        : "all";

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(account);
    return groups;
  }, {});

  const renderSkeletonCards = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="relative overflow-hidden">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-32 bg-primary/10 rounded animate-pulse" />
                <div className="h-3 w-24 bg-primary/10 rounded animate-pulse" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-6 w-24 bg-primary/10 rounded animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-primary/10 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-primary/10 rounded animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderEmptyState = () => (
    <Card className="p-12 text-center">
      <CardHeader>
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Wallet className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="mt-4">No accounts found</CardTitle>
        <CardDescription>
          Get started by connecting your first account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          className="mt-4"
          onClick={() =>
            toast({
              title: "Coming soon!",
              description: "Account connection feature will be available soon.",
            })
          }
        >
          <Plus className="mr-2 h-4 w-4" /> Connect Account
        </Button>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Accounts</h2>
        </div>
        {renderSkeletonCards()}
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <h2 className="text-3xl font-bold tracking-tight">Accounts</h2>
        <div className="flex flex-col space-y-2 md:flex-row md:space-x-2 md:space-y-0">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Accounts</SelectItem>
              <SelectItem value="depository">Depository</SelectItem>
              <SelectItem value="credit">Credit</SelectItem>
              <SelectItem value="loan">Loan</SelectItem>
              <SelectItem value="investment">Investment</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="balance">Balance</SelectItem>
              <SelectItem value="type">Type</SelectItem>
            </SelectContent>
          </Select>
          <Select value={groupBy} onValueChange={setGroupBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Group by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Grouping</SelectItem>
              <SelectItem value="institution">Institution</SelectItem>
              <SelectItem value="type">Account Type</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {accounts.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedAccounts).map(([group, groupAccounts]) => (
            <div key={group} className="space-y-4">
              {groupBy !== "none" && (
                <h3 className="text-lg font-semibold capitalize">{group}</h3>
              )}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {(groupAccounts as Account[]).map((account) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    onDeleted={handleAccountDeleted}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <Toaster />
    </div>
  );
}
