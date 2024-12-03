const mongoose = require('mongoose');
const Transaction = require('../Transactions/transaction.model');
const { getInstitutionDetails } = require('../Items/Item.service');

// Utility functions for calculations
const calculateCreditUtilization = (balance, limit) => {
  if (!limit || limit === 0) return 0;
  return parseFloat(((Math.abs(balance) / limit) * 100).toFixed(2));
};

const calculateSavingsRate = (income, expenses) => {
  if (!income || income === 0) return 0;
  return parseFloat((((income - expenses) / income) * 100).toFixed(2));
};

// Helper function to determine if a transaction is income
const isIncomeTransaction = (transaction) => {
  if (transaction.personal_finance_category?.primary === 'INCOME') return true;
  // For manual transactions without personal_finance_category
  if (transaction.amount > 0 && !transaction.personal_finance_category) return true;
  return false;
};

async function aggregateAllTransactions(accountId) {
  try {
    const transactions = await Transaction.find({
      account_id: accountId,
      $or: [
        { pending: false },
        { pending: { $exists: false } } // Include manual transactions
      ]
    }).sort({ date: -1 });

    // Initialize summary statistics
    const summary = {
      totalIncome: 0,
      totalExpenses: 0,
      totalTransactions: transactions.length,
      largestIncome: 0,
      largestExpense: 0,
      avgTransactionAmount: 0,
      latestTransactionAmount: transactions[0]?.amount || 0
    };

    // Initialize category tracking
    const categoryMap = new Map();
    const merchantMap = new Map();
    const paymentStats = {
      totalPayments: 0,
      paymentCount: 0,
      avgPayment: 0
    };
    const recurringStats = {
      totalRecurring: 0,
      count: 0
    };

    // Process each transaction
    let totalAmount = 0;
    transactions.forEach(transaction => {
      const amount = transaction.amount;
      totalAmount += amount;

      // Update income/expense totals
      if (isIncomeTransaction(transaction)) {
        summary.totalIncome += Math.abs(amount);
        summary.largestIncome = Math.max(summary.largestIncome, Math.abs(amount));
      } else {
        summary.totalExpenses += amount;
        summary.largestExpense = Math.min(summary.largestExpense, amount);
      }

      // Process categories
      const category = transaction.personal_finance_category?.primary ||
                      transaction.category?.[0] ||
                      'GENERAL_MERCHANDISE';
      
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          totalAmount: 0,
          count: 0,
          averageAmount: 0
        });
      }
      const catStats = categoryMap.get(category);
      catStats.totalAmount += amount;
      catStats.count++;
      catStats.averageAmount = catStats.totalAmount / catStats.count;

      // Process merchants
      const merchantName = transaction.merchant_name || transaction.name;
      if (!merchantMap.has(merchantName)) {
        merchantMap.set(merchantName, {
          totalSpent: 0,
          frequency: 0,
          avgSpend: 0
        });
      }
      const merchStats = merchantMap.get(merchantName);
      merchStats.totalSpent += Math.abs(amount);
      merchStats.frequency++;
      merchStats.avgSpend = merchStats.totalSpent / merchStats.frequency;

      // Update payment stats if it's a payment
      if (category === 'PAYMENT' || transaction.payment_meta) {
        paymentStats.totalPayments += Math.abs(amount);
        paymentStats.paymentCount++;
      }

      // Update recurring stats if it's recurring
      if (transaction.payment_channel === 'recurring' ||
          transaction.personal_finance_category?.detailed?.includes('RECURRING')) {
        recurringStats.totalRecurring += Math.abs(amount);
        recurringStats.count++;
      }
    });

    // Calculate averages
    summary.avgTransactionAmount = totalAmount / Math.max(1, transactions.length);
    paymentStats.avgPayment = paymentStats.totalPayments / Math.max(1, paymentStats.paymentCount);

    // Convert maps to arrays and sort
    const categories = Array.from(categoryMap.entries()).map(([name, stats]) => ({
      _id: name,
      ...stats
    }));

    const topMerchants = Array.from(merchantMap.entries())
      .map(([name, stats]) => ({
        _id: name,
        ...stats
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    return {
      summary,
      categories,
      topMerchants,
      paymentStats,
      recurringStats,
      lastTransaction: transactions[0] || null
    };
  } catch (error) {
    console.error('Error aggregating transactions:', error);
    throw error;
  }
}

const transformPlaidAccount = async (plaidAccount, itemId) => {
  // Get institution details
  const Item = require('../Items/Item.model');
  const item = await Item.findOne({ item_id: itemId });
  
  const accountId = plaidAccount.id;
  
  return {
    account_id: accountId,
    id: accountId, // For backward compatibility
    item_id: itemId,
    persistent_account_id: accountId,
    
    name: plaidAccount.name,
    official_name: plaidAccount.official_name,
    mask: plaidAccount.mask || accountId.slice(-4),
    type: plaidAccount.type.toLowerCase(),
    subtype: plaidAccount.subtype ? plaidAccount.subtype.toLowerCase() : null,
    
    balances: {
      available: plaidAccount.balances.available,
      current: plaidAccount.balances.current,
      limit: plaidAccount.balances.limit,
      previous: plaidAccount.balances.current, // Initialize previous with current
      iso_currency_code: plaidAccount.balances.iso_currency_code || 'USD',
      unofficial_currency_code: plaidAccount.balances.unofficial_currency_code
    },
    
    status: 'active',
    connection_type: 'plaid',
    institution: item ? {
      institution_id: item.institution_id,
      name: item.institution_name,
      logo: null
    } : null,
    
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
};

const transformManualAccount = (manualAccount) => {
  const timestamp = new Date().toISOString();
  const accountId = `manual_${Date.now()}`;
  
  return {
    account_id: accountId,
    id: accountId,
    item_id: accountId, // Use same ID for item_id to maintain consistency
    persistent_account_id: accountId,
    
    name: manualAccount.name || 'Manual Account',
    official_name: manualAccount.official_name,
    mask: manualAccount.mask || accountId.slice(-4),
    type: (manualAccount.type || 'depository').toLowerCase(),
    subtype: manualAccount.subtype ? manualAccount.subtype.toLowerCase() : null,
    
    balances: {
      available: manualAccount.balances?.available || 0,
      current: manualAccount.balances?.current || 0,
      limit: manualAccount.balances?.limit || null,
      previous: manualAccount.balances?.current || 0,
      iso_currency_code: manualAccount.balances?.iso_currency_code || 'USD',
      unofficial_currency_code: manualAccount.balances?.unofficial_currency_code
    },
    
    status: 'active',
    connection_type: 'manual', // Explicitly set connection_type
    institution: {
      institution_id: 'manual',
      name: 'Manual Entry',
      logo: null
    },
    
    created_at: timestamp,
    updated_at: timestamp
  };
};

const transformAccountForAPI = async (dbAccount) => {
  const Item = require('../Items/Item.model');
  const Transaction = require('../Transactions/transaction.model');
  
  // Get institution details
  let institution = null;
  if (dbAccount.item_id) {
    const item = await Item.findOne({ item_id: dbAccount.item_id });
    if (item) {
      institution = {
        institution_id: item.institution_id,
        name: item.institution_name,
        logo: null // Add logo URL if available
      };
    }
  }

  // Get transaction statistics
  const stats = await Transaction.aggregate([
    { $match: { account_id: dbAccount.account_id } },
    {
      $group: {
        _id: null,
        totalIncome: {
          $sum: {
            $cond: [{ $gt: ["$amount", 0] }, "$amount", 0]
          }
        },
        totalExpenses: {
          $sum: {
            $cond: [{ $lt: ["$amount", 0] }, "$amount", 0]
          }
        },
        count: { $sum: 1 },
        avgAmount: { $avg: "$amount" }
      }
    }
  ]);

  const statistics = stats.length > 0 ? {
    total: {
      income: stats[0].totalIncome || 0,
      expenses: Math.abs(stats[0].totalExpenses) || 0,
      transactions: stats[0].count || 0,
      net: (stats[0].totalIncome + stats[0].totalExpenses) || 0
    }
  } : null;

  return {
    account_id: dbAccount.account_id,
    id: dbAccount.account_id,
    item_id: dbAccount.item_id,
    persistent_account_id: dbAccount.persistent_account_id,
    
    name: dbAccount.name,
    official_name: dbAccount.official_name,
    mask: dbAccount.mask || dbAccount.account_id.slice(-4),
    type: dbAccount.type.toLowerCase(),
    subtype: dbAccount.subtype,
    
    balances: {
      available: dbAccount.balances.available,
      current: dbAccount.balances.current,
      limit: dbAccount.balances.limit,
      previous: dbAccount.balances.previous,
      iso_currency_code: dbAccount.balances.iso_currency_code || 'USD',
      unofficial_currency_code: dbAccount.balances.unofficial_currency_code
    },
    
    status: dbAccount.status,
    connection_type: dbAccount.connection_type.toLowerCase(),
    institution,
    statistics,
    
    created_at: dbAccount.created_at.toISOString(),
    updated_at: dbAccount.updated_at.toISOString()
  };
};

module.exports = {
  transformPlaidAccount,
  transformManualAccount,
  transformAccountForAPI
};
