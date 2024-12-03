import ApiService from "../utilities/apiService";
import { Account } from "../types/account";

class Accounts {
  private accounts: Account[] = [];
  private accountsListener: ((accounts: Account[]) => void)[] = [];

  constructor() {
    this.accounts = [];
  }

  getAccountsList = (): Promise<Account[]> => {
    return new Promise((resolve, reject) => {
      ApiService.get("/api/accounts")
        .then((response) => {
          console.log("accounts fetched", response);
          this.callAccountsListeners(response);
          resolve(response);
        })
        .catch((error) => {
          reject(error);
        });
    });
  };

  createManualAccount = async (accountData: Partial<Account>): Promise<Account> => {
    try {
      // Transform the data to match backend expectations
      const account = {
        bankName: accountData.name,
        accountNumber: accountData.mask || '0000',
        accountType: accountData.subtype || 'checking',
        balance: accountData.balances?.current || 0,
        creditLimit: accountData.balances?.limit || null,
        connection_type: 'manual',
        type: accountData.type || 'depository',
        status: 'active'
      };

      const response = await ApiService.post("/api/accounts", account);

      // Update local accounts list
      const updatedAccounts = await this.getAccountsList();
      this.callAccountsListeners(updatedAccounts);

      return response;
    } catch (error) {
      console.error('Error creating manual account:', error);
      throw error;
    }
  };

  async deleteAccount(accountId: string): Promise<void> {
    try {
      const response = await ApiService.delete(`/api/accounts/${accountId}`);

      if (!response) {
        throw new Error('Failed to delete account');
      }

      // Immediately fetch updated accounts list after deletion
      const updatedAccounts = await this.getAccountsList();

      // Notify all listeners of the update
      this.callAccountsListeners(updatedAccounts);

      // Clear any cached data for this account
      this.clearAccountCache(accountId);
    } catch (error) {
      console.error('Error in deleteAccount:', error);
      throw error;
    }
  }

  async refreshAccount(accountId: string): Promise<{ account: Account; transactionsUpdated: number }> {
    try {
      const response = await ApiService.post(`/api/accounts/${accountId}/refresh`);
      
      if (!response) {
        throw new Error('Failed to refresh account');
      }

      // Update local accounts list after refresh
      const updatedAccounts = await this.getAccountsList();
      this.callAccountsListeners(updatedAccounts);

      return response;
    } catch (error) {
      console.error('Error in refreshAccount:', error);
      throw error;
    }
  }

  private clearAccountCache(accountId: string): void {
    const index = this.accounts.findIndex(acc =>
      acc.id === accountId || acc.account_id === accountId
    );
    if (index !== -1) {
      this.accounts.splice(index, 1);
    }
  }

  registeraccountsListener(listener: (accounts: Account[]) => void): number {
    this.accountsListener.push(listener);
    return this.accountsListener.length - 1;
  }

  unregisteraccountsListener(index: number): void {
    this.accountsListener.splice(index, 1);
  }

  private callAccountsListeners(updatedList: Account[]): void {
    console.log("Calling account listeners");
    this.accountsListener.forEach((listener) => {
      listener(updatedList);
    });
  }
}

let AccountService: Accounts | null = null;

export const GetAccountService = (): Accounts => {
  if (!AccountService) {
    AccountService = new Accounts();
  }
  return AccountService;
};
