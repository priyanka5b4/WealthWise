import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const IncomeExpenseChart = ({ transactions }) => {
  const getChartData = () => {
    const incomeCategories = ["INCOME", "TRANSFER_IN"];

    const expenseCategories = [
      "TRANSFER_OUT",
      "LOAN_PAYMENTS",
      "BANK_FEES",
      "ENTERTAINMENT",
      "FOOD_AND_DRINK",
      "GENERAL_MERCHANDISE",
      "HOME_IMPROVEMENT",
      "MEDICAL",
      "PERSONAL_CARE",
      "GENERAL_SERVICES",
      "GOVERNMENT_AND_NON_PROFIT",
      "TRANSPORTATION",
      "TRAVEL",
      "RENT_AND_UTILITIES",
    ];

    const years = [
      ...new Set(
        transactions.map((transaction) =>
          new Date(transaction.date).getFullYear()
        )
      ),
    ];

    const chartData = {
      labels: years,
      datasets: [
        {
          label: "Income",
          data: years.map((year) =>
            transactions
              .filter(
                (transaction) =>
                  incomeCategories.includes(
                    transaction.personal_finance_category.primary
                  ) && new Date(transaction.date).getFullYear() === year
              )
              .reduce((sum, transaction) => sum + transaction.amount, 0)
          ),
          borderColor: "green",
          backgroundColor: "rgba(0, 128, 0, 0.5)",
        },
        {
          label: "Expenses",
          data: years.map((year) =>
            transactions
              .filter(
                (transaction) =>
                  expenseCategories.includes(
                    transaction.personal_finance_category.primary
                  ) && new Date(transaction.date).getFullYear() === year
              )
              .reduce(
                (sum, transaction) => sum + Math.abs(transaction.amount),
                0
              )
          ),
          borderColor: "red",
          backgroundColor: "rgba(255, 0, 0, 0.5)",
        },
      ],
    };
    return chartData;
  };

  return (
    <div>
      <h2>Income vs Expenses</h2>
      <Line data={getChartData()} />
    </div>
  );
};

export default IncomeExpenseChart;
