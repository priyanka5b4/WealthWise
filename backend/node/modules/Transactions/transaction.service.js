const datamodel = require('../../core/dbLib/data.service');
const Transaction = require('./transaction.model');
const Account = require('../Accounts/account.model');
const { getCategoryColorClasses } = require('../utils/getCategoryColors');

module.exports.InsertTransaction = async (newTransaction) => {
  try {
    if (typeof newTransaction.counterparties === 'string') {
      try {
        newTransaction.counterparties = JSON.parse(
          newTransaction.counterparties,
        );
      } catch (error) {
        console.error('Error parsing counterparties:', error);
        transactionData.counterparties = [];
      }
    }
    const tTransaction = new Transaction(newTransaction);

    await tTransaction.save();
  } catch (err) {
    console.log(err);
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

    // Get all transactions sorted by date
    const transactions = await Transaction.find({
      account_id: { $in: accountIds },
      pending: false,
    }).sort({ date: 1 });

    if (!transactions.length) {
      return res.status(404).json({
        success: false,
        message: 'No transactions found',
      });
    }

    // Create a map of account types for quick lookup
    const accountTypeMap = accounts.reduce((map, account) => {
      map[account.account_id] = account.type;
      return map;
    }, {});

    // Initialize networth tracking
    let netWorthData = [];
    let runningBalance = 0;
    let currentDate = null;
    let previousValue = 0;

    // Process transactions day by day
    transactions.forEach((transaction) => {
      const transactionDate = transaction.date;
      const accountType = accountTypeMap[transaction.account_id];
      const isPrimaryIncome =
        transaction.personal_finance_category?.primary === 'INCOME';

      let amountChange = transaction.amount;

      if (accountType === 'depository') {
        if (isPrimaryIncome) {
          // For income transactions in depository accounts, amount should be positive
          amountChange = Math.abs(amountChange);
        } else {
          // For non-income transactions in deposit accounts, reverse the sign
          amountChange = -amountChange;
        }
      } else if (accountType === 'credit') {
        // For credit accounts, keep the sign as is
        // Positive amount means payment made (increase balance)
        // Negative amount means credit used (decrease balance)
        amountChange = amountChange;
      }

      // If this is a new date, create a new entry
      if (transactionDate !== currentDate) {
        if (currentDate !== null) {
          // Save the previous day's final value
          netWorthData.push({
            date: currentDate,
            value: parseFloat(runningBalance.toFixed(2)),
            previousValue: parseFloat(previousValue.toFixed(2)),
          });
        }
        previousValue = runningBalance;
        currentDate = transactionDate;
      }

      runningBalance += amountChange;
    });

    // Add the final day
    if (currentDate) {
      netWorthData.push({
        date: currentDate,
        value: parseFloat(runningBalance.toFixed(2)),
        previousValue: parseFloat(previousValue.toFixed(2)),
      });
    }

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
    // Get all accounts
    const accounts = await Account.find({});
    if (!accounts.length) {
      return res.status(404).json({
        success: false,
        message: 'No accounts found',
      });
    }

    const accountIds = accounts.map((account) => account.account_id);

    // Create a map of account names for grouping
    const accountNameMap = accounts.reduce((map, account) => {
      map[account.account_id] = account.name;
      return map;
    }, {});

    const transactions = await Transaction.find({
      account_id: { $in: accountIds },
      pending: false,
    });

    // Initialize income and expenses maps
    const incomeMap = new Map();
    const expensesMap = new Map();

    // Process transactions
    transactions.forEach((transaction) => {
      const accountName = accountNameMap[transaction.account_id];
      let amount = Math.abs(transaction.amount);

      // Handle amounts based on personal_finance_category
      if (transaction.personal_finance_category?.primary === 'INCOME') {
        // For income category, amount is already positive
        incomeMap.set(accountName, (incomeMap.get(accountName) || 0) + amount);
      } else {
        // For non-income categories:
        // Positive values mean money moving out (expenses)
        // Negative values mean money moving in (income)
        if (transaction.amount > 0) {
          // Expense
          expensesMap.set(
            accountName,
            (expensesMap.get(accountName) || 0) + amount,
          );
        } else {
          // Income (like refunds, deposits)
          incomeMap.set(
            accountName,
            (incomeMap.get(accountName) || 0) + amount,
          );
        }
      }
    });

    const incomeData = Array.from(incomeMap, ([accountName, amount]) => ({
      accountName,
      amount,
    }));

    const expensesData = Array.from(expensesMap, ([accountName, amount]) => ({
      accountName,
      amount: Math.abs(amount), // Convert negative expenses to positive values
    }));
    console.log(incomeData, expensesData);
    res.json({
      income: incomeData,
      expenses: expensesData,
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
    if (!accounts.length) {
      return res.status(404).json({
        success: false,
        message: 'No accounts found',
      });
    }

    const accountIds = accounts.map((account) => account.account_id);

    const transactions = await Transaction.find({
      account_id: { $in: accountIds },
      pending: false,
    });

    // Initialize tracking variables
    const categorySpending = new Map(); // Track spending by main category
    const uniqueCategories = new Set(); // Track unique categories
    let totalSpend = 0;
    let transactionCount = 0;

    // Process transactions
    transactions.forEach((transaction) => {
      // Skip income transactions
      if (
        transaction.personal_finance_category?.primary === 'INCOME' ||
        transaction.amount <= 0
      ) {
        // Skip negative amounts (money coming in)
        return;
      }

      const detailedCategory =
        transaction.personal_finance_category?.detailed ||
        'GENERAL_MERCHANDISE_OTHER';
      const mainCategory = getMainCategory(detailedCategory);

      // Add to unique categories set
      uniqueCategories.add(mainCategory);

      // Track spending by category
      const currentSpend = categorySpending.get(mainCategory) || 0;
      categorySpending.set(mainCategory, currentSpend + transaction.amount);

      // Update totals
      totalSpend += transaction.amount;
      transactionCount++;
    });

    // Calculate categories array
    const categories = Array.from(categorySpending.entries())
      .map(([category, amount]) => ({
        name: formatCategoryName(category),
        amount: -amount, // Negative to represent spending
        percentage: parseFloat(((amount / totalSpend) * 100).toFixed(2)),
        color: getCategoryColorClasses(category),
      }))
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

    // Find highest spend category
    const highestSpendCategory = formatCategoryName(
      Array.from(categorySpending.entries()).sort(
        (a, b) => b[1] - a[1],
      )[0]?.[0] || 'GENERAL_MERCHANDISE',
    );

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
        value:
          transactionCount > 0
            ? `$${(totalSpend / transactionCount).toFixed(2)}`
            : '$0.00',
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
function formatCategoryName(category) {
  return category
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace(/And/g, '&'); // Replace "And" with "&" for better display
}

// Helper function to get main category from detailed category
function getMainCategory(detailedCategory) {
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
