import React, { useEffect, useState } from "react";
import styles from "./TransactionTable.module.css";

const TransactionTable = ({ transactions, accounts }) => {
  const [filterCategory, setFilterCategory] = useState("");
  const [filteredTransactions, setFilteredTransactions] =
    useState(transactions);
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 5;

  useEffect(() => {
    setFilteredTransactions(transactions);
    setFilterCategory("");
  }, [transactions]);

  const handleCategoryFilter = (category) => {
    setFilterCategory(category);
    if (category === "") {
      setFilteredTransactions(transactions);
      return;
    }
    const filtered = transactions.filter(
      (transaction) =>
        transaction.personal_finance_category.primary === category
    );
    setFilteredTransactions(filtered);
    setCurrentPage(1); // Reset current page when filter changes
  };

  const getInstitutionName = (transaction) => {
    const account = accounts.find(
      (account) => account.account_id === transaction.account_id
    );
    return account ? account.institution_name : "-";
  };

  const getAccountName = (transaction) => {
    const account = accounts.find(
      (account) => account.account_id === transaction.account_id
    );
    console.log(account);
    return account ? account.account_name : "-";
  };

  const categories = [
    ...new Set(
      transactions.map(
        (transaction) => transaction.personal_finance_category.primary
      )
    ),
  ];

  // Get current transactions based on pagination
  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = filteredTransactions.slice(
    indexOfFirstTransaction,
    indexOfLastTransaction
  );

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className={styles.container}>
      <div
        style={{
          display: "flex",
          flexDirection: "row-reverse",
          alignItems: "baseline",
        }}
      >
        <p style={{ fontSize: "2rem" }}>RANSACTIONS...</p>
        <h1 style={{ fontSize: "3.5rem" }}>T</h1>
        <button
          style={{
            backgroundColor: "#509afa",
            hover: "#2684FF",
            color: "white",
            fontSize: "1.5rem",
            padding: "10px",
            borderRadius: "5px",
          }}
          onClick={() => {
            window.open("http://localhost:3001/retrieval_agents", "_blank");
          }}
        >
          Finance AI
        </button>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Institution Name</th>
            <th>Account Name</th>
            <th>Transaction Name</th>
            <th>
              Category
              <div className={styles.filters}>
                <div className={styles.buttonRow}>
                  <button
                    className={`${styles.filterButton} ${
                      filterCategory === "" ? styles.active : ""
                    }`}
                    onClick={() => handleCategoryFilter("")}
                  >
                    All
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category}
                      className={`${styles.filterButton} ${
                        filterCategory === category ? styles.active : ""
                      }`}
                      onClick={() => handleCategoryFilter(category)}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </th>
            {/* <th>Balance</th>
            <th>Merchant Name</th>
            
            <th>Category Expenses</th> */}
            <th>Transaction Amount</th>
          </tr>
        </thead>
        <tbody>
          {currentTransactions.map((transaction) => (
            <tr key={transaction.transaction_id} className={styles.row}>
              <td>{transaction.date}</td>
              <td>{getInstitutionName(transaction)}</td>
              <td>{getAccountName(transaction)}</td>
              <td>{transaction.name}</td>
              <td>{transaction.personal_finance_category.primary}</td>
              <td>{transaction.amount}</td>
              {/* <td>{transaction.merchant_name || "-"}</td>
              <td>
                {calculateCategoryExpenses(
                  transaction.personal_finance_category.primary
                )}
              </td>
              <td>{transaction.amount}</td> */}
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination
        transactionsPerPage={transactionsPerPage}
        totalTransactions={filteredTransactions.length}
        paginate={paginate}
        currentPage={currentPage}
      />
    </div>
  );
};

const Pagination = ({
  transactionsPerPage,
  totalTransactions,
  paginate,
  currentPage,
}) => {
  const pageNumbers = [];

  for (
    let i = 1;
    i <= Math.ceil(totalTransactions / transactionsPerPage);
    i++
  ) {
    pageNumbers.push(i);
  }

  return (
    <nav>
      <ul className={styles.pagination}>
        {pageNumbers.map((number) => (
          <li key={number} className={styles.pageItem}>
            <a
              onClick={() => paginate(number)}
              href="#"
              className={currentPage === number ? styles.active : ""}
            >
              {number}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default TransactionTable;
