export interface AccountBalances {
  available: number | null;
  current: number;
  limit: number | null;
  previous: number;
  iso_currency_code: string;
  unofficial_currency_code?: string;
}

export type AccountType = 'depository' | 'credit' | 'loan' | 'investment' | 'other';
export type AccountSubtype = 'checking' | 'savings' | 'credit card' | 'loan' | 'investment' | null;
export type AccountStatus = 'active' | 'inactive' | 'closed';
export type ConnectionType = 'manual' | 'plaid';

export interface Institution {
  institution_id: string;
  name: string;
  logo?: string | null;
}

export interface Account {
  // Core fields
  id?: string;
  account_id: string;
  item_id: string;
  persistent_account_id: string;
  
  // Account details
  name: string;
  official_name?: string;
  mask?: string;
  type: AccountType;
  subtype: AccountSubtype | null;
  
  // Balance information
  balances: AccountBalances;
  
  // Status and connection
  status: AccountStatus;
  connection_type: ConnectionType;
  
  // Institution information
  institution?: Institution;
  
  // Legacy fields (temporary, for backward compatibility)
  ConnectionType?: ConnectionType;
  change?: number;
  number?: string;
  
  // Optional frontend-specific fields
  statistics?: {
    total?: {
      income: number;
      expenses: number;
      transactions: number;
      net: number;
    };
    transactions?: {
      count: number;
      averageAmount: number;
      largest: {
        income: number;
        expense: number;
      };
      latestTransactionAmount: number;
    };
    lastTransaction?: {
      date: string;
      amount: number;
    };
    categories?: Array<{
      name: string;
      total: number;
      count: number;
      average: number;
      category_url?: string;
      percentage: number;
    }>;
    merchants?: Array<{
      name: string;
      totalSpent: number;
      frequency: number;
      averageSpend: number;
    }>;
  };
  
  // Timestamps
  created_at: string;
  updated_at: string;
}
