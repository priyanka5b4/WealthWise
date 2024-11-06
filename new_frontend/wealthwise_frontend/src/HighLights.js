import React, { useEffect, useState } from "react";
import styles from "./HighLightsCard.module.css";
import Typewriter from "./TypeWtiter";

function HighlightsCard({ transactions }) {
  const [currentBalance, setCurrentBalance] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);
  const [mostSpentCategory, setMostSpentCategory] = useState("");
  const [mostSpentCategoryAmount, setMostSpentCategoryAmount] = useState(0);

  useEffect(() => {
    let balance = 0;
    let expenses = 0;
    let credit = 0;
    const categoryAmounts = {};

    transactions.forEach((transaction) => {
      const { amount, personal_finance_category } = transaction;
      const { primary } = personal_finance_category;

      if (amount > 0) {
        credit += amount;
      } else {
        expenses += Math.abs(amount);
      }

      if (categoryAmounts[primary]) {
        categoryAmounts[primary] += Math.abs(amount);
      } else {
        categoryAmounts[primary] = Math.abs(amount);
      }

      balance += amount;
    });

    setCurrentBalance(balance.toFixed(2));
    setTotalExpenses(expenses.toFixed(2));
    setTotalCredit(credit.toFixed(2));

    const sortedCategories = Object.entries(categoryAmounts).sort(
      (a, b) => b[1] - a[1]
    );

    if (sortedCategories.length > 0) {
      setMostSpentCategory(sortedCategories[0][0]);
      setMostSpentCategoryAmount(sortedCategories[0][1]);
    }
  }, [transactions]);

  return (
    <div className={styles.highlightsCard}>
      <div className={styles.highlightsContainer}>
        <div className={styles.highlightItem}>
          <p className={styles.highlightLabel}>Current Balance:</p>
          <p className={styles.highlightValue}>${currentBalance}</p>
        </div>
        <div className={styles.highlightItem}>
          <p className={styles.highlightLabel}>Total Expenses:</p>
          <p className={styles.highlightValue}>${totalExpenses}</p>
        </div>
        <div className={styles.highlightItem}>
          <p className={styles.highlightLabel}>Total Credit:</p>
          <p className={styles.highlightValue}>${totalCredit}</p>
        </div>
        <div className={styles.highlightItem}>
          <p className={styles.highlightLabel}>Most Spent Category:</p>
          <div className={styles.highlightValue}>
            {mostSpentCategory} (${mostSpentCategoryAmount})
          </div>
        </div>
      </div>
    </div>
  );
}

export default HighlightsCard;
