import React from "react";
import { Doughnut } from "react-chartjs-2";
import { ArcElement } from "chart.js";
import styles from "./TransactionTable.module.css";
import { useEffect, useState } from "react";
import { Chart } from "chart.js/auto";
import { CiRainbow } from "react-icons/ci";

// Register the ArcElement plugin
Chart.register(ArcElement);

const CategoryExpensesChart = ({ transactions }) => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    console.log("filtered transactions ", transactions);
    if (transactions) {
      const Tempcategories = [
        ...new Set(
          transactions.map(
            (transaction) => transaction.personal_finance_category.primary
          )
        ),
      ];
      setCategories(Tempcategories);
    }
  }, [transactions]);

  const calculateCategoryExpenses = (category) => {
    const categoryTransactions = transactions.filter(
      (transaction) =>
        transaction.personal_finance_category.primary === category
    );
    const totalExpenses = categoryTransactions.reduce((sum, transaction) => {
      if (transaction.amount < 0) {
        return sum + Math.abs(transaction.amount);
      }
      return sum;
    }, 0);
    return totalExpenses.toFixed(2);
  };

  const getChartData = () => {
    const chartData = {
      labels: categories,
      datasets: [
        {
          data: categories.map((category) =>
            calculateCategoryExpenses(category)
          ),
          backgroundColor: categories.map(
            () =>
              `rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(
                Math.random() * 256
              )}, ${Math.floor(Math.random() * 256)}, 0.6)`
          ),
          // AnimationEffect: "easeInOutCubic",
        },
      ],
    };
    return chartData;
  };

  return (
    <div className={styles.chartContainer}>
      <h2>Category Expenses</h2>
      <Doughnut data={getChartData()} />
    </div>
  );
};

export default CategoryExpensesChart;
