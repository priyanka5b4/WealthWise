import { useEffect, useState } from "react";
import Table from "../Table";
import Error from "../Error";
import styles from "./index.module.scss";
import {
  ErrorDataItem,
  transactionsCategories,
  transformTransactionsData,
} from "../../dataUtilities";
import Button from "plaid-threads/Button";

const Transactions = ({ transactionsData, setTransactionsData }) => {
  const [transactions, setTransactions] = useState([]);
  const [showTable, setShowTable] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const getData = async () => {
      setIsLoading(true);
      const response = await fetch(`/api/transactions`, { method: "GET" });
      const data = await response.json();
      console.log(data);
      if (data.error != null) {
        setError(data.error);
        setIsLoading(false);
        return;
      }
      setTransactionsData(data);
      setTransactions(transformTransactionsData(data)); // transform data into proper format for each individual product
      setShowTable(true);
      setIsLoading(false);
    };

    getData();
  }, []);

  return (
    <div className={styles.endpointContainer}>
      {showTable && (
        <Table categories={transactionsCategories} data={transactions} />
      )}
      {error != null && <Error error={error} />}
    </div>
  );
};

export default Transactions;
