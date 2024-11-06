import React from "react";
import { Chart as ChartJS, registerables } from "chart.js";
import { Chart } from "react-chartjs-2";
import moment from "moment";

ChartJS.register(...registerables);

interface Counterparty {
  confidence_level: string;
  entity_id: string | null;
  logo_url: string | null;
  name: string;
  phone_number: string | null;
  type: string;
  website: string | null;
}

interface Location {
  address: string | null;
  city: string | null;
  country: string | null;
  lat: string | null;
  lon: string | null;
  postal_code: string | null;
  region: string | null;
  store_number: string | null;
}

interface PaymentMeta {
  by_order_of: string | null;
  payee: string | null;
  payer: string | null;
  payment_method: string | null;
  payment_processor: string | null;
  ppd_id: string | null;
  reason: string | null;
  reference_number: string | null;
}

interface PersonalFinanceCategory {
  confidence_level: string;
  detailed: string;
  primary: string;
}

interface Transaction {
  account_id: string;
  account_owner: string | null;
  amount: number;
  authorized_date: string;
  authorized_datetime: string | null;
  category: string[];
  category_id: string;
  check_number: string | null;
  counterparties: Counterparty[];
  date: string;
  datetime: string | null;
  iso_currency_code: string;
  location: Location;
  logo_url: string;
  merchant_entity_id: string;
  merchant_name: string;
  name: string;
  payment_channel: string;
  payment_meta: PaymentMeta;
  pending: boolean;
  pending_transaction_id: string | null;
  personal_finance_category: PersonalFinanceCategory;
  personal_finance_category_icon_url: string;
  transaction_code: string | null;
  transaction_id: string;
  transaction_type: string;
  unofficial_currency_code: string | null;
  website: string;
}
interface InsightsProps {
  transactionsData: any;
}

const Insights: React.FC<InsightsProps> = (props: any) => {
  const transactions = props.transactionsData;

  console.log(transactions);

  // Transaction Timeline
  const timelineData = {
    labels: transactions.map((transaction: Transaction) => transaction.date),
    datasets: [
      {
        data: transactions.map(
          (transaction: Transaction) => transaction.amount
        ),
        backgroundColor: "#007bff",
        borderColor: "#007bff",
        borderWidth: 1,
      },
    ],
  };

  // Income vs. Expense Area Chart
  const incomeExpenseData = {
    labels: transactions.map((transaction: Transaction) => transaction.date),
    datasets: [
      {
        label: "Income",
        data: transactions
          .filter((transaction: Transaction) => transaction.amount > 0)
          .map((transaction: Transaction) => transaction.amount),
        backgroundColor: "#007bff",
      },
      {
        label: "Expense",
        data: transactions
          .filter((transaction: Transaction) => transaction.amount < 0)
          .map((transaction: Transaction) => Math.abs(transaction.amount)),
        backgroundColor: "#dc3545",
      },
    ],
  };

  // Category Spending by amount
  const categorySpendingData = {
    labels: transactions.map(
      (transaction: Transaction) => transaction.category
    ),
    datasets: transactions.map((transaction: Transaction) => ({
      label: transaction.category,
      data: transactions.map((t: Transaction) =>
        t.category === transaction.category ? t.amount : 0
      ),
      borderColor: "#007bff",
      backgroundColor: "#007bff",
    })),
  };

  // Spending by Day of the Week
  const dayOfWeekData = {
    labels: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    datasets: [
      {
        label: "Amount Spent",
        data: [0, 0, 0, 0, 0, 0, 0],
        backgroundColor: "#007bff",
      },
    ],
  };

  transactions.forEach((transaction: Transaction) => {
    const dayIndex = new Date(transaction.date).getDay();
    dayOfWeekData.datasets[0].data[dayIndex] += transaction.amount;
  });

  // Monthly Expense Trend Line Chart
  const monthlyExpenseTrendData = {
    labels: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    datasets: [
      {
        label: "Total Expenses",
        data: calculateMonthlyExpenses(transactions),
        borderColor: "#007bff",
        backgroundColor: "transparent",
        pointBorderColor: "#007bff",
        pointBackgroundColor: "#007bff",
        pointRadius: 5,
        pointHoverRadius: 10,
        fill: false,
      },
    ],
  };

  // Function to calculate monthly expenses
  function calculateMonthlyExpenses(transactions: any) {
    const monthlyExpenses = new Array(12).fill(0);
    transactions.forEach((transaction: any) => {
      const monthIndex = new Date(transaction.date).getMonth();
      if (transaction.amount < 0) {
        monthlyExpenses[monthIndex] += Math.abs(transaction.amount);
      }
    });
    return monthlyExpenses;
  }

  // Transaction Count by Day of the Week
  const transactionCountByDayData = {
    labels: [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ],
    datasets: [
      {
        label: "Transaction Count",
        data: calculateTransactionCountByDay(transactions),
        backgroundColor: "#007bff",
      },
    ],
  };

  const transactionCountByDayDataOptions = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      y: {
        ticks: {
          precision: 0, // Set precision to 0 to display integer values
          beginAtZero: true, // Start the axis at zero
        },
      },
    },
  };

  // Function to calculate transaction count by day of the week
  function calculateTransactionCountByDay(transactions: any) {
    const transactionCount = [0, 0, 0, 0, 0, 0, 0];
    transactions.forEach((transaction: any) => {
      const dayIndex = new Date(transaction.date).getDay();
      transactionCount[dayIndex]++;
    });
    return transactionCount;
  }

  // Category Spending by Amount
  const categorySpendingDataByPrimary = {
    labels: calculateCategories(transactions),
    datasets: [
      {
        label: "Amount Spent",
        data: calculateCategoryAmounts(transactions),
        backgroundColor: "#007bff",
      },
    ],
  };

  // Function to extract unique categories from transactions
  function calculateCategories(transactions: any) {
    const categories = new Set();
    transactions.forEach((transaction: any) => {
      if (
        transaction.personal_finance_category &&
        transaction.personal_finance_category.primary
      ) {
        categories.add(transaction.personal_finance_category.primary);
      }
    });
    return Array.from(categories);
  }

  // Function to calculate amount spent for each category
  function calculateCategoryAmounts(transactions: any) {
    const categoryAmounts = new Map();
    transactions.forEach((transaction: any) => {
      if (
        transaction.personal_finance_category &&
        transaction.personal_finance_category.primary
      ) {
        const category = transaction.personal_finance_category.primary;
        if (categoryAmounts.has(category)) {
          categoryAmounts.set(
            category,
            categoryAmounts.get(category) + Math.abs(transaction.amount)
          );
        } else {
          categoryAmounts.set(category, Math.abs(transaction.amount));
        }
      }
    });
    return Array.from(categoryAmounts.values());
  }

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    height: 200, // Adjust the height as per your requirement
  };

  // Top Spending Categories Radar Chart
  const topCategories = calculateTopSpendingCategories(transactions, 5); // Change 5 to the desired number of top categories
  const categorySpending = calculateCategorySpending(
    transactions,
    topCategories
  );

  const topCategoriesRadarData = {
    labels: topCategories,
    datasets: [
      {
        label: "Spending",
        data: categorySpending,
        backgroundColor: "rgba(0, 123, 255, 0.2)",
        borderColor: "#007bff",
        pointBackgroundColor: "#007bff",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "#007bff",
      },
    ],
  };

  // Function to calculate top spending categories
  function calculateTopSpendingCategories(transactions: any, count: any) {
    const categoryMap = new Map();
    transactions.forEach((transaction: any) => {
      if (transaction.category) {
        transaction.category.forEach((category: any) => {
          categoryMap.set(
            category,
            (categoryMap.get(category) || 0) + Math.abs(transaction.amount)
          );
        });
      }
    });
    return Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map((entry) => entry[0]);
  }

  // Function to calculate spending for top categories
  function calculateCategorySpending(transactions: any, topCategories: any) {
    const spending = Array(topCategories.length).fill(0);
    transactions.forEach((transaction: any) => {
      if (transaction.category) {
        transaction.category.forEach((category: any, index: any) => {
          if (topCategories.includes(category)) {
            spending[topCategories.indexOf(category)] += Math.abs(
              transaction.amount
            );
          }
        });
      }
    });
    return spending;
  }

  // Convert transaction dates to formatted strings
  const formattedDates = transactions.map((transaction: any) =>
    moment(transaction.date).format("MMM DD, YYYY")
  );

  const bubbleChartData = {
    datasets: [
      {
        label: "Bubble Chart",
        data: transactions.map((transaction: any) => ({
          x: new Date(transaction.date), // Use date object for x-axis
          y: transaction.amount, // Y-axis: Transaction amount
          r: Math.abs(transaction.amount) / 10, // Bubble size proportional to transaction amount
        })),
        backgroundColor: "rgba(255, 99, 132, 0.6)",
        borderColor: "rgba(255, 99, 132, 1)",
      },
    ],
  };

  // Calculate total amount spent in each category
  // Define the type for categoryAmounts
  interface CategoryAmounts {
    [key: string]: number;
  }

  // Initialize categoryAmounts as an empty object
  const categoryAmounts: CategoryAmounts = {};

  // Calculate total amount spent in each category
  transactions.forEach((transaction: any) => {
    if (transaction.category) {
      transaction.category.forEach((category: any) => {
        categoryAmounts[category] =
          (categoryAmounts[category] || 0) + Math.abs(transaction.amount);
      });
    }
  });
  // Prepare data for doughnut chart
  const doughnutChartData = {
    labels: Object.keys(categoryAmounts),
    datasets: [
      {
        label: "Category Spending",
        data: Object.values(categoryAmounts),
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(153, 102, 255, 0.6)",
          // Add more colors as needed
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          // Add more colors as needed
        ],
        borderWidth: 1,
      },
    ],
  };
  interface DoughnutChartOptions {
    cutoutPercentage?: number;
    // Add other options as needed
  }

  const Donutoptions = {
    cutoutPercentage: 50, // Adjust the percentage as needed
  };

  return (
    <>
      <div>
        <h2>Insights</h2>
      </div>
      <div className="container">
        <div className="row">
          <div className="col-md-6">
            <h2>Spending by Day of the Week</h2>
            <Chart type="bar" data={dayOfWeekData} options={options} />
          </div>
        </div>
        <div className="row">
          <div className="col-md-6">
            <h2>Monthly Expense Trend</h2>
            <Chart
              type="line"
              data={monthlyExpenseTrendData}
              options={options}
            />
          </div>
        </div>
        <div className="row">
          <div className="col-md-6">
            <h2>Transaction Count by Day of the Week</h2>
            <Chart
              type="bar"
              data={transactionCountByDayData}
              options={transactionCountByDayDataOptions}
            />
          </div>
        </div>
        <div className="row">
          <div className="col-md-6">
            <h2>Amount Spent by category</h2>
            <Chart
              type="bar"
              data={categorySpendingDataByPrimary}
              options={options}
            />
          </div>
        </div>
        <div className="row">
          <div className="col-md-6">
            <div className="col-md-6">
              <h2>Top Spending Categories</h2>
              <Chart
                type="radar"
                data={topCategoriesRadarData}
                options={options}
              />
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-md-6">
            <h2>Transaction Timeline</h2>
            <Chart type="line" data={timelineData} options={options} />
          </div>
        </div>
        <div className="row">
          <div className="col-md-6">
            <h2>Category Spending by Amount</h2>
            <Chart type="doughnut" data={doughnutChartData} />
          </div>
        </div>
      </div>
    </>
  );
};

export default Insights;
