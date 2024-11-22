import React from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
} from "lucide-react";

const StatCard = ({ icon: Icon, label, value, trend, trendUp }) => (
  <div className="flex flex-col p-4 bg-white rounded-lg shadow-sm">
    <div className="flex items-center justify-between mb-2">
      <div className="p-2 rounded-full bg-gray-50">
        <Icon className="w-5 h-5 text-gray-600" />
      </div>
      {trend && (
        <span
          className={`flex items-center text-sm ${
            trendUp ? "text-green-500" : "text-red-500"
          }`}
        >
          {trendUp ? (
            <ArrowUpRight className="w-4 h-4" />
          ) : (
            <ArrowDownRight className="w-4 h-4" />
          )}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <span className="text-sm text-gray-600">{label}</span>
    <span className="text-lg font-semibold">{value}</span>
  </div>
);

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
};

const formatPercentage = (value) => {
  return `${value.toFixed(1)}%`;
};

const QuickStats = ({ stats, type }) => {
  if (!stats) return null;

  const getStatsConfig = () => {
    switch (type.toLowerCase()) {
      case "checking":
        return [
          {
            icon: TrendingUp,
            label: "Income",
            value: formatCurrency(stats.total.income),
            trend: stats.transactions.changeFromPrevious?.income,
          },
          {
            icon: TrendingDown,
            label: "Expenses",
            value: formatCurrency(stats.total.expenses),
            trend: stats.transactions.changeFromPrevious?.expenses,
            trendUp: false,
          },
          {
            icon: PieChart,
            label: "Savings Rate",
            value:
              stats.total.income !== 0
                ? formatPercentage(
                    ((stats.total.income - stats.total.expenses) /
                      stats.total.income) *
                      100
                  )
                : formatPercentage(0),
          },
        ];

      case "savings":
        return [
          {
            icon: TrendingUp,
            label: "Income",
            value: formatCurrency(stats.total.income),
            trend: stats.transactions.changeFromPrevious?.income,
          },
          {
            icon: TrendingDown,
            label: "Expenses",
            value: formatCurrency(stats.total.expenses),
            trend: stats.transactions.changeFromPrevious?.expenses,
            trendUp: false,
          },
          {
            icon: Wallet,
            label: "Recent Deposit",
            value: formatCurrency(stats.lastTransaction?.amount || 0),
          },
        ];

      case "credit":
        return [
          {
            icon: DollarSign,
            label: "Available Credit",
            value: formatCurrency(stats.credit?.balance?.available || 0),
          },
          {
            icon: Percent,
            label: "Utilization",
            value: formatPercentage(stats.credit?.balance?.utilization || 0),
          },
          {
            icon: CreditCard,
            label: "Rewards Points",
            value: Math.floor(
              stats.credit?.rewards?.total || 0
            ).toLocaleString(),
          },
        ];

      default:
        return [
          {
            icon: DollarSign,
            label: "Balance",
            value: formatCurrency(stats.total?.net || 0),
          },
          {
            icon: TrendingUp,
            label: "Transactions",
            value: stats.transactions?.count?.toLocaleString() || "0",
          },
          {
            icon: Wallet,
            label: "Average Transaction",
            value: formatCurrency(stats.transactions?.averageAmount || 0),
          },
        ];
    }
  };

  const statsConfig = getStatsConfig();

  return (
    <div className="grid grid-cols-3 gap-4">
      {statsConfig.map((stat, index) => (
        <StatCard
          key={index}
          icon={stat.icon}
          label={stat.label}
          value={stat.value}
          trend={stat.trend}
          trendUp={stat.trendUp !== false}
        />
      ))}
    </div>
  );
};

export default QuickStats;
