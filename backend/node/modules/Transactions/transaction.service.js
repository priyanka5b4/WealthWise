const datamodel = require('../../core/dbLib/data.service');
const Transaction = require('./transaction.model');
const Account = require('../Accounts/account.model');
const { getCategoryColorClasses } = require('../utils/getCategoryColors');
const { v4: uuidv4 } = require('uuid');

// Helper function to determine if a transaction is income
const isIncomeTransaction = (transaction, accountType) => {
  console.log(`Checking if transaction is income for account type: ${accountType}, transaction amount: ${transaction.amount}, transaction type: ${transaction.transaction_type}`);
  // For credit accounts
  if (accountType === 'credit') {
    // Negative amount means a payment/refund (money coming in)
    return transaction.amount < 0;
  }
  
  // For depository accounts (checking, savings)
  if (accountType === 'depository') {
    // Negative amount means money coming in for depository accounts
    return transaction.amount < 0;
  }
  
  // For investment accounts
  if (accountType === 'investment') {
    // Use the transaction type for investment accounts
    return transaction.transaction_type === 'income';
  }
  
  // Default case - negative means money in
  return transaction.amount < 0;
};

// Helper function to get transaction amount based on account type
const getTransactionAmount = (transaction, accountType) => {
  console.log(`Calculating transaction amount for account type: ${accountType}, transaction amount: ${transaction.amount}`);
  const amount = Math.abs(transaction.amount);
  
  // For credit accounts (both Plaid and manual)
  if (accountType === 'credit') {
    return transaction.amount > 0 ? -amount : amount;
  }
  
  // For depository accounts (both Plaid and manual)
  if (accountType === 'depository') {
    // For depository accounts, positive amounts are spending (outflow)
    // and negative amounts are income (inflow)
    return transaction.amount;  // Keep the original sign
  }
  
  // For investment accounts
  if (accountType === 'investment') {
    return transaction.amount;  // Keep original sign
  }
  
  // Default behavior for other account types
  return transaction.amount;
};

// Helper function to map manual categories to Plaid categories
const mapManualToPlaidCategory = (manualCategory) => {
  const categoryMap = {
    'INCOME': { primary: 'INCOME', detailed: 'INCOME_OTHER' },
    'SALARY': { primary: 'INCOME', detailed: 'INCOME_SALARY' },
    'TRANSFER': { primary: 'TRANSFER', detailed: 'TRANSFER_OTHER' },
    'FOOD': { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_RESTAURANTS' },
    'GROCERY': { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_GROCERIES' },
    'SHOPPING': { primary: 'SHOPPING', detailed: 'SHOPPING_GENERAL' },
    'TRANSPORT': { primary: 'TRANSPORTATION', detailed: 'TRANSPORTATION_OTHER' },
    'UTILITIES': { primary: 'UTILITIES', detailed: 'UTILITIES_OTHER' },
    'RENT': { primary: 'RENT_AND_UTILITIES', detailed: 'RENT' },
    'ENTERTAINMENT': { primary: 'ENTERTAINMENT', detailed: 'ENTERTAINMENT_OTHER' }
  };

  const normalizedCategory = manualCategory.toUpperCase();
  return categoryMap[normalizedCategory] || { 
    primary: 'GENERAL_MERCHANDISE', 
    detailed: 'GENERAL_MERCHANDISE_OTHER' 
  };
};

// Helper function to get transaction category
const getTransactionCategory = (transaction) => {
  console.log(`Determining category for transaction: ${JSON.stringify(transaction)}`);
  // For Plaid transactions
  if (transaction.personal_finance_category?.detailed) {
    return {
      primary: transaction.personal_finance_category.primary,
      detailed: transaction.personal_finance_category.detailed,
      confidence_level: transaction.personal_finance_category.confidence_level || 'HIGH'
    };
  }
  
  // For Plaid's regular category
  if (transaction.category && Array.isArray(transaction.category) && transaction.category.length > 0) {
    const detailed = transaction.category[transaction.category.length - 1];
    const primary = transaction.category[0];
    return {
      primary: primary,
      detailed: detailed,
      confidence_level: 'MEDIUM'
    };
  }
  
  // For manual transactions, map to closest Plaid category
  if (transaction.category) {
    const mappedCategory = mapManualToPlaidCategory(transaction.category);
    return {
      ...mappedCategory,
      confidence_level: 'MANUAL'
    };
  }
  
  // Default fallback
  return {
    primary: 'GENERAL_MERCHANDISE',
    detailed: 'GENERAL_MERCHANDISE_OTHER',
    confidence_level: transaction.manual ? 'MANUAL' : 'LOW'
  };
};

// Helper function to process manual transactions
const processManualTransaction = async (transaction) => {
  // Generate consistent transaction ID
  const transactionId = `manual_${uuidv4()}`;
  
  // Get account type for proper amount handling
  const account = await Account.findOne({ account_id: transaction.account_id });
  if (!account) {
    throw new Error(`Account not found: ${transaction.account_id}`);
  }

  // Standardize transaction data
  const standardizedTransaction = {
    transaction_id: transactionId,
    account_id: transaction.account_id,
    amount: transaction.amount,
    date: transaction.date,
    name: transaction.name,
    merchant_name: transaction.merchant_name || transaction.name,
    personal_finance_category: getTransactionCategory(transaction),
    payment_channel: 'other',
    pending: false,
    manual: true,
    authorized_date: transaction.date,
    authorized_datetime: new Date(transaction.date).toISOString(),
    category: transaction.category ? [transaction.category] : ['GENERAL_MERCHANDISE'],
    category_id: transaction.category_id || 'GENERAL_MERCHANDISE',
    iso_currency_code: transaction.iso_currency_code || 'USD'
  };

  // Update account balance
  await updateAccountBalance(
    transaction.account_id,
    standardizedTransaction.amount,
    account.type
  );

  return standardizedTransaction;
};

// Helper function to update account balance
const updateAccountBalance = async (accountId, amount, accountType) => {
  const account = await Account.findOne({ account_id: accountId });
  if (!account) {
    throw new Error(`Account not found: ${accountId}`);
  }
  
  // Handle credit accounts
  if (accountType.toLowerCase() === 'credit') {
    account.balances.current = (account.balances.current || 0) + amount;
    // Update available credit
    account.balances.available = (account.balances.limit || 0) - account.balances.current;
  } 
  // Handle depository accounts
  else {
    const balanceChange = amount;
    account.balances.current = (account.balances.current || 0) + balanceChange;
    account.balances.available = (account.balances.available || 0) + balanceChange;
  }
  
  await account.save();
  return account;
};

// Helper function to transform transaction to frontend format
const transformTransactionToFrontend = (transaction, accountType) => {
  const amount = getTransactionAmount(transaction, accountType);
  
  return {
    transaction_id: transaction._id || transaction.transaction_id,
    account_id: transaction.account_id,
    amount: amount,
    date: transaction.date,
    name: transaction.name,
    
    // Transaction metadata
    datetime: transaction.datetime,
    authorized_date: transaction.authorized_date,
    authorized_datetime: transaction.authorized_datetime,
    merchant_name: transaction.merchant_name,
    merchant_entity_id: transaction.merchant_entity_id,
    account_owner: transaction.account_owner,

    // Categorization
    category: Array.isArray(transaction.category) ? transaction.category : [transaction.category],
    category_id: transaction.category_id,
    personal_finance_category: transaction.personal_finance_category ? {
      primary: transaction.personal_finance_category.primary,
      detailed: transaction.personal_finance_category.detailed,
      confidence_level: transaction.personal_finance_category.confidence_level || 'LOW'
    } : undefined,

    // Additional metadata
    logo_url: transaction.logo_url,
    website: transaction.website,
    payment_meta: transaction.payment_meta,
    payment_channel: transaction.payment_channel || 'other',

    // Status fields
    pending: transaction.pending || false,
    pending_transaction_id: transaction.pending_transaction_id,
    transaction_code: transaction.transaction_code,
    transaction_type: transaction.transaction_type || (isIncomeTransaction(transaction, accountType) ? 'income' : 'expense'),

    // Location and counterparties
    location: transaction.location,
    counterparties: transaction.counterparties,

    // Currency
    iso_currency_code: transaction.iso_currency_code || 'USD',
    unofficial_currency_code: transaction.unofficial_currency_code,

    // Source tracking
    manual: transaction.manual || false,
    source: transaction.source || (transaction.manual ? 'manual' : 'plaid'),

    // Timestamps
    created_at: transaction.created_at?.toISOString(),
    updated_at: transaction.updated_at?.toISOString()
  };
};

// Update existing functions to use the transformation
module.exports.getTransactions = async (accountId) => {
  try {
    const account = await Account.findOne({ account_id: accountId });
    if (!account) {
      throw new Error('Account not found');
    }

    const transactions = await Transaction.find({ 
      account_id: accountId,
      $or: [
        { pending: false },
        { pending: { $exists: false } }
      ]
    }).sort({ date: -1 });

    return transactions.map(t => transformTransactionToFrontend(t, account.type));
  } catch (err) {
    console.error('Error getting transactions:', err);
    throw err;
  }
};

module.exports.InsertTransaction = async (newTransaction) => {
  try {
    if (typeof newTransaction.counterparties === 'string') {
      try {
        newTransaction.counterparties = JSON.parse(newTransaction.counterparties);
      } catch (error) {
        console.error('Error parsing counterparties:', error);
        newTransaction.counterparties = [];
      }
    }
    
    if (newTransaction.manual) {
      newTransaction = await processManualTransaction(newTransaction);
    } else {
      // For Plaid transactions, ensure transaction_type is set
      if (!newTransaction.transaction_type) {
        const account = await Account.findOne({ account_id: newTransaction.account_id });
        newTransaction.transaction_type = isIncomeTransaction(newTransaction, account?.type) ? 'income' : 'expense';
      }
    }
    
    const tTransaction = new Transaction(newTransaction);
    await tTransaction.save();
    console.log('Transaction saved successfully:', tTransaction.transaction_id);
    return tTransaction;
  } catch (err) {
    console.error('Error saving transaction:', err);
    throw err;
  }
};

module.exports.updateTransaction = async (transaction) => {
  try {
    await Transaction.updateOne(
      { transaction_id: transaction.transaction_id },
      transaction,
    );
  } catch (err) {
    console.log(err);
  }
};

module.exports.deleteTransaction = async (transaction_id) => {
  try {
    await Transaction.deleteOne({ transaction_id: transaction_id });
  } catch (err) {
    console.log(err);
  }
};

module.exports.getNetWorthHistory = async (req, res) => {
  try {
    // Get all accounts
    const accounts = await Account.find({});
    if (!accounts.length) {
      return res.status(404).json({
        success: false,
        message: 'No accounts found',
      });
    }

    const accountIds = accounts.map((account) => account.account_id);
    
    // Calculate initial balance from all accounts
    const initialBalance = accounts.reduce((total, account) => {
      return total + (account.current_balance || 0);
    }, 0);

    // Get all transactions sorted by date
    const transactions = await Transaction.find({
      account_id: { $in: accountIds },
      $or: [
        { pending: false },
        { pending: { $exists: false } }
      ]
    }).sort({ date: 1 });

    // Create a map of account types for quick lookup
    const accountTypeMap = accounts.reduce((map, account) => {
      map[account.account_id] = account.type;
      return map;
    }, {});

    // Initialize networth tracking
    let netWorthData = [];
    let runningBalance = initialBalance;
    let currentDate = null;
    let previousValue = initialBalance;

    // If no transactions, return just the initial balance
    if (!transactions.length) {
      const today = new Date().toISOString().split('T')[0];
      return res.json([{
        date: today,
        value: parseFloat(initialBalance.toFixed(2)),
        previousValue: parseFloat(initialBalance.toFixed(2)),
      }]);
    }

    // Group transactions by date
    const transactionsByDate = transactions.reduce((groups, transaction) => {
      const date = transaction.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
      return groups;
    }, {});

    // Process transactions day by day
    Object.entries(transactionsByDate).forEach(([date, dateTransactions]) => {
      let dailyChange = 0;
      
      dateTransactions.forEach((transaction) => {
        const accountType = accountTypeMap[transaction.account_id];
        dailyChange += getTransactionAmount(transaction, accountType);
      });

      runningBalance += dailyChange;
      
      netWorthData.push({
        date: date,
        value: parseFloat(runningBalance.toFixed(2)),
        previousValue: parseFloat(previousValue.toFixed(2)),
        change: parseFloat(dailyChange.toFixed(2))
      });
      
      previousValue = runningBalance;
    });

    return res.json(netWorthData);
  } catch (error) {
    console.error('Error calculating net worth history:', error);
    return res.status(500).json({
      success: false,
      message: 'Error calculating net worth history',
      error: error.message,
    });
  }
};

module.exports.getIncomeExpenses = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Get all accounts
    const accounts = await Account.find({});
    if (!accounts.length) {
      return res.status(404).json({
        success: false,
        message: 'No accounts found',
      });
    }

    const accountIds = accounts.map((account) => account.account_id);

    // Build query with date filtering
    const query = {
      account_id: { $in: accountIds },
      $or: [
        { pending: false },
        { pending: { $exists: false } }
      ]
    };

    if (startDate) {
      query.date = { ...query.date, $gte: new Date(startDate) };
    }
    if (endDate) {
      query.date = { ...query.date, $lte: new Date(endDate) };
    }

    console.log('Query:', JSON.stringify(query, null, 2));
    const transactions = await Transaction.find(query).sort({ date: -1 });
    console.log('Found transactions:', transactions.length);

    // Initialize category maps
    const incomeCategoryMap = new Map();
    const expensesCategoryMap = new Map();
    let totalIncome = 0;
    let totalExpenses = 0;

    // Process transactions
    transactions.forEach((transaction) => {
      // Skip transfers between owned accounts
      if (transaction.payment_channel === 'transfer' && accountIds.includes(transaction.account_id)) {
        return;
      }

      const amount = transaction.amount;
      
      // Get category
      let category = 'Uncategorized';
      if (transaction.personal_finance_category?.detailed) {
        category = transaction.personal_finance_category.detailed;
      } else if (transaction.category && Array.isArray(transaction.category) && transaction.category.length > 0) {
        category = transaction.category[transaction.category.length - 1];
      }

      // Log for debugging
      console.log('Processing:', {
        name: transaction.name,
        amount: amount,
        category
      });

      // Positive amount means income, negative means expense
      if (amount > 0) {
        incomeCategoryMap.set(category, (incomeCategoryMap.get(category) || 0) + amount);
        totalIncome += amount;
      } else {
        const expenseAmount = Math.abs(amount);
        expensesCategoryMap.set(category, (expensesCategoryMap.get(category) || 0) + expenseAmount);
        totalExpenses += expenseAmount;
      }
    });

    // Convert maps to arrays and sort by amount
    const incomeData = Array.from(incomeCategoryMap, ([category, amount]) => ({
      category,
      amount: parseFloat(amount.toFixed(2))
    })).sort((a, b) => b.amount - a.amount);

    const expensesData = Array.from(expensesCategoryMap, ([category, amount]) => ({
      category,
      amount: parseFloat(amount.toFixed(2))
    })).sort((a, b) => b.amount - a.amount);

    // Log results
    console.log('Income Data:', {
      categories: incomeData,
      total: totalIncome
    });
    console.log('Expense Data:', {
      categories: expensesData,
      total: totalExpenses
    });

    res.json({
      income: {
        categories: incomeData,
        total: parseFloat(totalIncome.toFixed(2))
      },
      expenses: {
        categories: expensesData,
        total: parseFloat(totalExpenses.toFixed(2))
      },
      summary: {
        netIncome: parseFloat((totalIncome - totalExpenses).toFixed(2)),
        savingsRate: totalIncome > 0 ? parseFloat(((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1)) : 0
      }
    });
  } catch (error) {
    console.error('Error calculating income and expenses:', error);
    return res.status(500).json({
      success: false,
      message: 'Error calculating income and expenses',
      error: error.message,
    });
  }
};

module.exports.getSpendingCategoriesAndStats = async (req, res) => {
  try {
    // Get all accounts
    const accounts = await Account.find({});
    console.log('Found accounts:', accounts.length);
    if (!accounts.length) {
      return res.status(404).json({
        success: false,
        message: 'No accounts found',
      });
    }

    const accountIds = accounts.map((account) => account.account_id);
    const accountTypeMap = accounts.reduce((map, account) => {
      map[account.account_id] = account.type;
      return map;
    }, {});
    console.log('Account IDs:', accountIds);

    const transactions = await Transaction.find({
      account_id: { $in: accountIds },
      $or: [
        { pending: false },
        { pending: { $exists: false } } // Include manual transactions
      ]
    });
    console.log('Found transactions:', transactions.length);

    // Initialize tracking variables
    const categorySpending = new Map();
    const uniqueCategories = new Set();
    let totalSpend = 0;
    let transactionCount = 0;

    // Process transactions
    transactions.forEach((transaction) => {
      const accountType = accountTypeMap[transaction.account_id];
      const amount = Math.abs(transaction.amount); // Use absolute amount for spending
      console.log(`Processing transaction: Amount=${amount}, AccountType=${accountType}, Name=${transaction.name}`);

      // Skip income transactions (negative amounts for depository accounts are income)
      if (transaction.amount < 0) {
        console.log('Skipping transaction - is income');
        return;
      }

      // Get the primary category for grouping
      let primaryCategory;
      if (transaction.personal_finance_category?.primary) {
        primaryCategory = transaction.personal_finance_category.primary;
      } else if (Array.isArray(transaction.category)) {
        primaryCategory = transaction.category[0];
      } else {
        primaryCategory = 'OTHER';
      }
      
      console.log(`Category for transaction: ${primaryCategory}`);

      // Add to unique categories set
      uniqueCategories.add(primaryCategory);

      // Track spending by category
      const currentSpend = categorySpending.get(primaryCategory) || 0;
      categorySpending.set(primaryCategory, currentSpend + amount);
      console.log(`Updated category ${primaryCategory} spending to: ${categorySpending.get(primaryCategory)}`);

      // Update totals
      totalSpend += amount;
      transactionCount++;
    });

    console.log('Final category spending:', Object.fromEntries(categorySpending));
    console.log('Total spend:', totalSpend);
    console.log('Transaction count:', transactionCount);

    // Calculate categories array
    const categories = Array.from(categorySpending.entries())
      .map(([category, amount]) => {
        const formattedName = formatCategoryName(category);
        return {
          name: formattedName,
          amount: amount,
          percentage: parseFloat(((amount / totalSpend) * 100).toFixed(2)),
          color: getCategoryColorClasses(category), // Pass the original category for color mapping
        };
      })
      .sort((a, b) => b.amount - a.amount);

    // Find highest spend category
    const highestSpendCategory = categories[0]?.name || 'No spending';

    // Calculate stats
    const stats = [
      {
        label: 'Total Categories',
        value: uniqueCategories.size.toString(),
      },
      {
        label: 'Highest Spend',
        value: highestSpendCategory,
      },
      {
        label: 'Average Transaction',
        value: transactionCount > 0 ? `$${(totalSpend / transactionCount).toFixed(2)}` : '$0.00',
      },
    ];

    return res.json({
      categories,
      stats,
    });
  } catch (error) {
    console.error('Error calculating spending categories:', error);
    return res.status(500).json({
      success: false,
      message: 'Error calculating spending categories',
      error: error.message,
    });
  }
};

// Helper function to format category names for display
const formatCategoryName = (category) => {
  if (!category) return 'Other';
  
  // Convert to string and handle formatting
  const str = String(category)
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
    
  return str || 'Other';
};

// Helper function to get main category from detailed category
function getMainCategory(detailedCategory) {
  console.log(`Mapping detailed category to main category: ${detailedCategory}`);
  const mainCategoryMap = {
    FOOD_AND_DRINK: ['FOOD', 'DRINK'],
    GENERAL_MERCHANDISE: ['GENERAL', 'MERCHANDISE'],
    HOME_IMPROVEMENT: ['HOME', 'IMPROVEMENT'],
    PERSONAL_CARE: ['PERSONAL', 'CARE'],
    GENERAL_SERVICES: ['GENERAL', 'SERVICES'],
    GOVERNMENT_AND_NON_PROFIT: ['GOVERNMENT', 'NON', 'PROFIT'],
    RENT_AND_UTILITIES: ['RENT', 'UTILITIES'],
  };

  const parts = detailedCategory.split('_');
  const firstTwoParts = parts.slice(0, 2).join('_');

  // Check if it's a special two-word category
  if (mainCategoryMap[firstTwoParts]) {
    return firstTwoParts;
  }

  // Check if it's a three-word category
  const firstThreeParts = parts.slice(0, 3).join('_');
  if (mainCategoryMap[firstThreeParts]) {
    return firstThreeParts;
  }

  // Default to first part if no match found
  return parts[0];
}

// Color mapping object (as defined in previous response)
