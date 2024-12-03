import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { Transaction } from '../types/transaction';

interface TransactionChartProps {
  transactions: Transaction[];
  timeframe?: 'week' | 'month' | 'year';
}

interface ChartData {
  date: string;
  rawDate: Date;
  income: number;
  expenses: number;
  net: number;
}

const TransactionChart: React.FC<TransactionChartProps> = ({ transactions, timeframe = 'month' }) => {
  const chartData = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let dateFormat: string;

    // Determine date range based on timeframe
    switch (timeframe) {
      case 'week':
        startDate = subDays(now, 7);
        dateFormat = 'EEE';
        break;
      case 'year':
        startDate = subMonths(now, 12);
        dateFormat = 'MMM';
        break;
      case 'month':
      default:
        startDate = startOfMonth(now);
        dateFormat = 'dd MMM';
    }

    // Create a map of all dates in the range
    const dateRange = eachDayOfInterval({
      start: startDate,
      end: now
    });

    const initialData: { [key: string]: ChartData } = {};
    dateRange.forEach(date => {
      const dateKey = format(date, dateFormat);
      initialData[dateKey] = {
        date: dateKey,
        rawDate: date,
        income: 0,
        expenses: 0,
        net: 0,
      };
    });
    
    // Process transactions
    transactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      if (date < startDate || date > now) return;

      const dateKey = format(date, dateFormat);
      if (!initialData[dateKey]) return;

      const amount = Math.abs(transaction.amount);
      if (transaction.amount > 0) {
        initialData[dateKey].income += amount;
        initialData[dateKey].net += amount;
      } else {
        initialData[dateKey].expenses += amount;
        initialData[dateKey].net -= amount;
      }
    });

    // Convert to array and sort by date
    return Object.values(initialData).sort((a, b) => 
      a.rawDate.getTime() - b.rawDate.getTime()
    );
  }, [transactions, timeframe]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="w-full h-[400px] bg-white rounded-lg shadow-sm p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={formatCurrency}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid #e2e8f0',
              borderRadius: '0.5rem',
            }}
          />
          <Legend />
          <Bar 
            dataKey="income" 
            fill="#10B981" 
            radius={[4, 4, 0, 0]}
            name="Income"
          />
          <Bar 
            dataKey="expenses" 
            fill="#EF4444" 
            radius={[4, 4, 0, 0]}
            name="Expenses"
          />
          <Bar 
            dataKey="net" 
            fill="#6366F1" 
            radius={[4, 4, 0, 0]}
            name="Net"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TransactionChart;
