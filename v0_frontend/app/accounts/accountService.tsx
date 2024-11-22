import ApiService from "../utilities/apiService";

class Accounts {
  accounts = [];
  accountsListener = [];

  //   selectedAccount = "All banks";

  constructor() {
    this.accounts = [];
  }

  getAccountsList = () => {
    return new Promise((resolve, reject) => {
      ApiService.get("/api/accounts")
        .then((response) => {
          console.log("accounts fetched", response);
          this.callaccountsListeners(response);
          resolve(response);
        })
        .catch((error) => {
          // console.log(error);
          reject(error);
        });
    });
  };

  registeraccountsListener(listener) {
    this.accountsListener.push(listener);
    return this.accountsListener.length - 1;
  }

  unregisteraccountsListener(index) {
    this.accountsListener.splice(index, 1);
  }

  callaccountsListeners(updatedList: AccountMetadata) {
    console.log("callaccountListeneres");
    this.accountsListener.forEach((listener) => {
      console.log("listener");
      listener(updatedList);
    });
  }
}

let AccountService = null;
export const GetAccountService = () => {
  if (!AccountService) {
    AccountService = new Accounts();
  }
  return AccountService;
};
