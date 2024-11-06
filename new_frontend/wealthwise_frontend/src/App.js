import logo from "./logo.svg";
import Dropdown from "./Dropdown";
import "./App.css";
import { useEffect } from "react";
import { useState } from "react";
import axios from "axios";
import { LinkContext } from "./Context";
import { GetInstitutionService } from "./InstututionService";
import MainText from "./MainText";
import Link from "./Link";
import MonthDropdown from "./MonthDropdown";
import HighlightsCard from "./HighLights";
import TransactionTable from "./TransactionTable";
import CategoryExpensesChart from "./categoryEdpenseschart";
import IncomeExpenseChart from "./IncomeExpenseChart";

function App() {
  const [transactions, SetTransactions] = useState([]);
  const [Institutions, setInstitutions] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState("");
  const [linkToken, setLinkToken] = useState(null);
  const InstitutionService = GetInstitutionService();
  const [accounts, setAccounts] = useState([]);

  // dates for transactions

  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [dateOptions, setDateOptions] = useState([]);

  const DropdownOptions = [
    {
      value: "All banks",
      label: "All banks",
    },
    ...Institutions.map((account) => ({
      value: account.institution_name,
      label: account.institution_name,
    })),
  ];

  const filterTransactionsByInstitution = (name) => {
    // console.log(name);
    // Filter the institution by name
    const institution = Institutions.find(
      (inst) => inst.institution_name === name
    );
    if (!institution) {
      // console.log("No institution found with the given name");
      setFilteredTransactions([]);
      return [];
    }

    // Extract account IDs from the filtered institution
    const accountIds = institution.accounts.map(
      (account) => account.account_id
    );

    accountIds.map((accountId) => {
      console.log(accountId);
    });

    // Filter transactions based on these account IDs
    const filtered = transactions.filter((transaction) =>
      accountIds.includes(transaction.account_id)
    );

    console.log("filtered Transactions based on organisation", filtered);

    setFilteredTransactions(filtered);
    return filtered;
  };

  useEffect(() => {
    let fileteredTransactionsByInstitution = [];

    console.log(selectedInstitution.value);
    console.log(selectedDate.value);

    if (!selectedInstitution || !selectedDate) {
      setFilteredTransactions(transactions);
    } else if (
      selectedInstitution.value === "All banks" &&
      selectedDate.value === "All Years"
    ) {
      setFilteredTransactions(transactions);
    } else if (selectedInstitution.value === "All banks") {
      const results = transactions.filter((transaction) => {
        const yearMonth = new Date(transaction.date).toISOString().slice(0, 7);
        return yearMonth === selectedDate.value;
      });
      setFilteredTransactions(results);
    } else if (selectedDate.value === "All Years") {
      filterTransactionsByInstitution(selectedInstitution.value);
    } else {
      fileteredTransactionsByInstitution = filterTransactionsByInstitution(
        selectedInstitution.value
      );
      const results = fileteredTransactionsByInstitution.filter(
        (transaction) => {
          const yearMonth = new Date(transaction.date)
            .toISOString()
            .slice(0, 7);

          return yearMonth === selectedDate.value;
        }
      );
      setFilteredTransactions(results);
    }
  }, [selectedDate, selectedInstitution]);

  useEffect(() => {
    axios
      .get("/api/transactions")
      .then((response) => {
        SetTransactions(response.data);

        const dateSet = new Set();
        response.data.forEach((transaction) => {
          const yearMonth = new Date(transaction.date)
            .toISOString()
            .slice(0, 7); // Gets 'YYYY-MM'
          dateSet.add(yearMonth);
        });
        const sortedDates = Array.from(dateSet).sort();
        const dateOptions = [
          {
            value: "All Years",
            label: "All Years",
          },
          ...sortedDates.map((date) => ({
            value: date,
            label: date,
          })),
        ];
        setDateOptions(dateOptions);
        setFilteredTransactions(response.data);
        setSelectedInstitution(DropdownOptions[0]);
        setSelectedDate(dateOptions[0]);
      })
      .catch((error) => {
        // console.log(error);
      });

    axios.post("/api/create_link_token").then((response) => {
      // console.log(response.data);
      setLinkToken(response.data.link_token);
    });

    const uuid =
      InstitutionService.registerInstitutionListener(setInstitutions);

    InstitutionService.getInstitutionsList().then((response) => {
      // console.log("response", response.data);
      setInstitutions(response.data);
      response.data.forEach((institution) => {
        console.log("ins", institution);
        institution.accounts.forEach((account) => {
          setAccounts((prev) => [
            ...prev,
            {
              account_id: account.account_id,
              account_name: account.name,
              institution_name: institution.institution_name,
            },
          ]);
        });
      });
    });

    return () => {
      InstitutionService.unregisterInstitutionListener(uuid);
    };
  }, []);

  return (
    <LinkContext.Provider value={linkToken}>
      <div className="App">
        <div
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            display: "flex",
            flexDirection: "row",
          }}
        >
          {linkToken && <Link />}

          <Dropdown
            options={DropdownOptions}
            selectedInstitution={selectedInstitution}
            setSelectedInstitution={setSelectedInstitution}
          ></Dropdown>
        </div>

        {/* app content  */}
        <div>
          <MainText
            options={DropdownOptions}
            selectedInstitution={selectedInstitution}
            setSelectedInstitution={setSelectedInstitution}
          />
        </div>
        <div style={{ float: "left", margin: "10px" }}>
          <MonthDropdown
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            dateOptions={dateOptions}
            filteredTransactions={filteredTransactions}
          />
        </div>

        {/* main app  */}
        <div style={{ position: "absolute", top: "250px" }}>
          <div
            style={{
              marginLeft: "20px",
              marginTop: "50px",
              display: "flex",
            }}
          >
            <HighlightsCard transactions={filteredTransactions} />
            <div
              style={{
                marginLeft: "10px",
                alignItems: "centre",
              }}
            >
              <CategoryExpensesChart transactions={filteredTransactions} />
            </div>
            <div
              style={{
                marginLeft: "10px",
                marginRight: "10px",
                alignItems: "center",
              }}
            >
              <IncomeExpenseChart transactions={filteredTransactions} />
            </div>
          </div>
          <div style={{ marginLeft: "30px", marginTop: "50px" }}>
            <TransactionTable
              transactions={filteredTransactions}
              accounts={accounts}
            />
          </div>
        </div>
      </div>

      {/* Highlighted card  */}
    </LinkContext.Provider>
  );
}

export default App;
