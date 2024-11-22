import { useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type TimeRange = "week" | "month" | "2months" | "5months" | "year" | "2years";

interface Transaction {
  date: string;
  amount: number;
}

interface ChartDataPoint {
  date: Date;
  xAxisLabel: string;
  income: number;
  expenses: number;
}

interface TransactionChartProps {
  transactions: Transaction[];
}

export const TransactionChart = ({ transactions }: TransactionChartProps) => {
  const [selectedRange, setSelectedRange] = useState<TimeRange>("month");

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const timeRanges = [
    { value: "week", label: "Past Week" },
    { value: "month", label: "Past Month" },
    { value: "2months", label: "Past 2 Months" },
    { value: "5months", label: "Past 5 Months" },
    { value: "year", label: "Past Year" },
    { value: "2years", label: "Past 2 Years" },
  ] as const;

  const getDateRange = (range: TimeRange): Date => {
    const now = new Date();
    const past = new Date();

    switch (range) {
      case "week":
        past.setDate(now.getDate() - 7);
        break;
      case "month":
        past.setMonth(now.getMonth() - 1);
        break;
      case "2months":
        past.setMonth(now.getMonth() - 2);
        break;
      case "5months":
        past.setMonth(now.getMonth() - 5);
        break;
      case "year":
        past.setFullYear(now.getFullYear() - 1);
        break;
      case "2years":
        past.setFullYear(now.getFullYear() - 2);
        break;
    }
    return past;
  };

  const chartData = useMemo(() => {
    const startDate = getDateRange(selectedRange);

    const filteredTransactions = transactions.filter(
      (t) => new Date(t.date) >= startDate
    );

    const monthlyData = filteredTransactions.reduce<
      Record<string, ChartDataPoint>
    >((acc, t) => {
      const date = new Date(t.date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;

      if (!acc[key]) {
        acc[key] = {
          date: date,
          xAxisLabel: `${months[date.getMonth()]} ${date.getFullYear()}`,
          income: 0,
          expenses: 0,
        };
      }

      if (t.amount > 0) {
        acc[key].income += t.amount;
      } else {
        acc[key].expenses += Math.abs(t.amount);
      }
      return acc;
    }, {});

    return Object.values(monthlyData).sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
  }, [transactions, selectedRange, months]);

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Transaction Trend</CardTitle>
          <Select
            value={selectedRange}
            onValueChange={(value: TimeRange) => setSelectedRange(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              {timeRanges.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="xAxisLabel"
                interval={0}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
              <Tooltip
                formatter={(value: number) => `$${value.toLocaleString()}`}
                labelFormatter={(label: string) => label}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="income"
                stroke="#22c55e"
                strokeWidth={2}
                dot={true}
                name="Income"
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="#ef4444"
                strokeWidth={2}
                dot={true}
                name="Expenses"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionChart;
