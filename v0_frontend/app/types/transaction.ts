export type ConfidenceLevel = 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | 'MANUAL';
export type TransactionStatus = 'pending' | 'posted' | 'cancelled';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type PaymentChannel = 'online' | 'in store' | 'other' | 'recurring';
export type TransactionSource = 'plaid' | 'manual' | 'import';

export interface Location {
  address?: string;
  city?: string;
  region?: string;
  postal_code?: string;
  country?: string;
  lat?: number;
  lon?: number;
  store_number?: string;
}

export interface PaymentMeta {
  by_order_of?: string;
  payee?: string;
  payer?: string;
  payment_method?: string;
  payment_processor?: string;
  ppd_id?: string;
  reason?: string;
  reference_number?: string;
}

export interface Counterparty {
  name?: string;
  type?: string;
  entity_id?: string;
  confidence_level?: Exclude<ConfidenceLevel, 'MANUAL'>;
  logo_url?: string;
  website?: string;
  phone_number?: string;
}

export interface PersonalFinanceCategory {
  primary: string;
  detailed: string;
  confidence_level: ConfidenceLevel;
}

export interface Transaction {
  // Core fields
  transaction_id: string;
  account_id: string;
  amount: number;
  date: string;
  
  // Transaction details
  name: string;
  merchant_name?: string;
  description?: string;
  
  // Categorization
  category: string[];
  personal_finance_category: PersonalFinanceCategory;
  
  // Status and type
  status: TransactionStatus;
  transaction_type: TransactionType;
  
  // Additional metadata
  datetime?: string;
  authorized_date?: string;
  authorized_datetime?: string;
  logo_url?: string;
  website?: string;
  payment_meta?: PaymentMeta;
  payment_channel?: PaymentChannel;
  pending_transaction_id?: string;
  transaction_code?: string;
  
  // Location and counterparties
  location?: Location;
  counterparties?: Counterparty[];
  
  // Currency
  iso_currency_code: string;
  unofficial_currency_code?: string;
  
  // Source tracking
  source: TransactionSource;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface TransactionSummary {
  date: string;
  income: number;
  expenses: number;
  net: number;
}

export interface TransactionFilter {
  startDate?: string;
  endDate?: string;
  categories?: string[];
  accounts?: string[];
  transactionTypes?: TransactionType[];
  minAmount?: number;
  maxAmount?: number;
  searchTerm?: string;
  source?: TransactionSource[];
  status?: TransactionStatus[];
}
