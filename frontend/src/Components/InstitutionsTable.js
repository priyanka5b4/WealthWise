import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import Context from "../Context";
import Products from "./ProductTypes/Products";
import Button from "plaid-threads/Button";
function InstitutionsTable() {
  const [institutions, setInstitutions] = useState([]);
  const { linkSuccess, isItemAccess } = useContext(Context);
  const [showTransactions, setShowTransactions] = useState(false);
  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        const response = await axios.get("/api/institutions"); // Adjust the URL as needed
        setInstitutions(response.data);
      } catch (error) {
        console.error("Failed to fetch institutions:", error);
      }
    };

    fetchInstitutions();
  }, [isItemAccess]);

  return (
    <>
      {institutions.length !== 0 && (
        <div>
          <h2>Accounts Overview</h2>

          <Button
            type="button"
            large
            onClick={() => {
              setShowTransactions(true);
            }}
            style={{ marginBottom: "20px" }}
          >
            Show Transactions
          </Button>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              margin: "20px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f2f2f2", textAlign: "left" }}>
                <th style={{ border: "1px solid #dddddd", padding: "8px" }}>
                  Institution Name
                </th>
                <th style={{ border: "1px solid #dddddd", padding: "8px" }}>
                  Account Name
                </th>
                <th style={{ border: "1px solid #dddddd", padding: "8px" }}>
                  Subtype
                </th>
                <th style={{ border: "1px solid #dddddd", padding: "8px" }}>
                  Available Balance
                </th>
                <th style={{ border: "1px solid #dddddd", padding: "8px" }}>
                  Currency
                </th>
              </tr>
            </thead>
            <tbody>
              {institutions.map((inst) =>
                inst.accounts.map((acc) => (
                  <tr key={acc._id}>
                    <td style={{ border: "1px solid #dddddd", padding: "8px" }}>
                      {inst.institution_name}
                    </td>
                    <td style={{ border: "1px solid #dddddd", padding: "8px" }}>
                      {acc.name}
                    </td>
                    <td style={{ border: "1px solid #dddddd", padding: "8px" }}>
                      {acc.subtype}
                    </td>
                    <td style={{ border: "1px solid #dddddd", padding: "8px" }}>
                      {acc.balances.available}
                    </td>
                    <td style={{ border: "1px solid #dddddd", padding: "8px" }}>
                      {acc.balances.iso_currency_code}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      {isItemAccess && showTransactions && (
        <div style={{ margin: "20px" }}>
          <Products />
        </div>
      )}
    </>
  );
}

export default InstitutionsTable;
