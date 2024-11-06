import React, { useContext, useEffect } from "react";
import Context from "../../Context";
import ProductTypesContainer from "./ProductTypesContainer";
import {
  transactionsCategories,
  authCategories,
  identityCategories,
  balanceCategories,
  investmentsCategories,
  investmentsTransactionsCategories,
  liabilitiesCategories,
  paymentCategories,
  assetsCategories,
  incomePaystubsCategories,
  transferCategories,
  transferAuthorizationCategories,
  signalCategories,
  statementsCategories,
  transformAuthData,
  transformTransactionsData,
  transformBalanceData,
  transformInvestmentsData,
  transformInvestmentTransactionsData,
  transformLiabilitiesData,
  transformIdentityData,
  transformPaymentData,
  transformAssetsData,
  transformTransferData,
  transformTransferAuthorizationData,
  transformIncomePaystubsData,
  transformSignalData,
  transformStatementsData,
} from "../../dataUtilities";
import Transactions from "../Transactions/transactions";
import Insights from "../Insights/index";
import { Router } from "react-router-dom";

const Products = () => {
  const { products } = useContext(Context);
  const [showInsights, setShowInsights] = React.useState(false);
  const [transactionsData, setTransactionsData] = React.useState([]);

  useEffect(() => {
    const getData = async () => {
      const response = await fetch(`/api/transactions`, { method: "GET" });
      const data = await response.json();
      console.log(data);
      setTransactionsData(data);
    };

    getData();
  }, []);

  return (
    <>
      <ProductTypesContainer
        productType="Recent Transactions"
        transactions={transactionsData}
      >
        <Transactions
          transactionsData={transactionsData}
          setTransactionsData={setTransactionsData}
        />
      </ProductTypesContainer>
    </>
  );
};

Products.displayName = "Products";

export default Products;
