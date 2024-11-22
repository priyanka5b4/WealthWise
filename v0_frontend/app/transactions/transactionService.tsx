import ApiService from "../utilities/apiService";

class Transaction {
  Transactions = [];
  TransactionsListener = [];

  //   selectedAccount = "All banks";

  constructor() {
    this.Transactions = [];
  }

  getTransactionsList = () => {
    return new Promise((resolve, reject) => {
      ApiService.get("/api/transactions")
        .then((response) => {
          console.log("Transactions fetched", response);
          this.callTransactionsListeners(response);
          resolve(response);
        })
        .catch((error) => {
          // console.log(error);
          reject(error);
        });
    });
  };

  registerTransactionsListener(listener) {
    this.TransactionsListener.push(listener);
    return this.TransactionsListener.length - 1;
  }

  unregisterTransactionsListener(index) {
    this.TransactionsListener.splice(index, 1);
  }

  callTransactionsListeners(updatedList) {
    console.log("call Transaction Listeneres");
    this.TransactionsListener.forEach((listener) => {
      console.log("listener");
      listener(updatedList);
    });
  }
}

let Transactionservice = null;
export const GetTransactionservice = () => {
  if (!Transactionservice) {
    Transactionservice = new Transaction();
  }
  return Transactionservice;
};
