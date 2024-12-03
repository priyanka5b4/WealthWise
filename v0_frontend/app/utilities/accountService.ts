import { Account } from '../types/account';

class AccountService {
  private static instance: AccountService;
  private accountsListeners: Map<string, (accounts: Account[]) => void>;
  private baseUrl: string;

  private constructor() {
    this.accountsListeners = new Map();
    this.baseUrl = '/api';
  }

  public static getInstance(): AccountService {
    if (!AccountService.instance) {
      AccountService.instance = new AccountService();
    }
    return AccountService.instance;
  }

  public async getAccountsList(): Promise<Account[]> {
    try {
      console.log('Fetching accounts...');
      const response = await fetch(`${this.baseUrl}/accounts`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const accounts = await response.json();
      console.log('Fetched accounts:', accounts);
      this.notifyAccountsListeners(accounts);
      return accounts;
    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }
  }

  public async createManualAccount(accountData: {
    bankName: string;
    accountNumber: string;
    accountType: string;
    balance: number;
    creditLimit?: number;
  }): Promise<Account | null> {
    try {
      const response = await fetch(`${this.baseUrl}/accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(accountData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newAccount = await response.json();
      await this.getAccountsList();
      return newAccount;
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  }

  public async deleteAccount(accountId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/accounts/${accountId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await this.getAccountsList();
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  }

  public registeraccountsListener(callback: (accounts: Account[]) => void): string {
    const id = Math.random().toString(36).substring(7);
    this.accountsListeners.set(id, callback);
    return id;
  }

  public unregisteraccountsListener(id: string): void {
    this.accountsListeners.delete(id);
  }

  public notifyAccountsListeners(accounts: Account[]): void {
    console.log('Notifying listeners with accounts:', accounts);
    this.accountsListeners.forEach((callback) => {
      callback(accounts);
    });
  }

  public async forceRefreshAccounts(): Promise<Account[]> {
    const accounts = await this.getAccountsList();
    this.notifyAccountsListeners(accounts);
    return accounts;
  }
}

export const GetAccountService = () => AccountService.getInstance();
