// account.utility.js
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

async function aggregateAllTransactions(accountId) {
  try {
    //console.log(accountId);
    const pipeline = [
      {
        $match: {
          account_id: accountId,
          pending: false,
        },
      },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                totalIncome: {
                  $sum: { $cond: [{ $gt: ['$amount', 0] }, '$amount', 0] },
                },
                totalExpenses: {
                  $sum: { $cond: [{ $lt: ['$amount', 0] }, '$amount', 0] },
                },
                totalTransactions: { $sum: 1 },
                largestIncome: {
                  $max: { $cond: [{ $gt: ['$amount', 0] }, '$amount', 0] },
                },
                largestExpense: {
                  $min: { $cond: [{ $lt: ['$amount', 0] }, '$amount', 0] },
                },
                avgTransactionAmount: { $avg: '$amount' },
              },
            },
          ],
          lastTransaction: [
            {
              $sort: { date: -1 },
            },
            {
              $limit: 1,
            },
            {
              $project: {
                amount: 1,
                date: 1,
                merchant_name: 1,
                name: 1,
                personal_finance_category: 1,
              },
            },
          ],
          categories: [
            {
              $group: {
                _id: '$personal_finance_category.primary',
                iconUrl: { $first: '$personal_finance_category_icon_url' },
                totalAmount: { $sum: '$amount' },
                count: { $sum: 1 },
                averageAmount: { $avg: '$amount' },
                maxAmount: { $max: '$amount' },
                minAmount: { $min: '$amount' },
                transactions: { $push: { amount: '$amount', date: '$date' } },
              },
            },
            { $sort: { totalAmount: 1 } },
          ],
          paymentAnalysis: [
            {
              $match: {
                $or: [
                  { 'personal_finance_category.primary': 'PAYMENT' },
                  { 'personal_finance_category.primary': 'BILL_PAYMENT' },
                ],
              },
            },
            {
              $group: {
                _id: null,
                totalPayments: { $sum: { $abs: '$amount' } },
                paymentCount: { $sum: 1 },
                avgPayment: { $avg: { $abs: '$amount' } },
                payments: { $push: { amount: '$amount', date: '$date' } },
              },
            },
          ],
          recurringTransactions: [
            {
              $match: {
                'personal_finance_category.primary': 'RECURRING',
              },
            },
            {
              $group: {
                _id: null,
                totalRecurring: { $sum: { $abs: '$amount' } },
                count: { $sum: 1 },
                transactions: { $push: { amount: '$amount', date: '$date' } },
              },
            },
          ],
          merchantAnalysis: [
            {
              $group: {
                _id: '$merchant_name',
                totalSpent: {
                  $sum: {
                    $cond: [{ $lt: ['$amount', 0] }, { $abs: '$amount' }, 0],
                  },
                },
                frequency: { $sum: 1 },
                avgSpend: { $avg: { $abs: '$amount' } },
              },
            },
            { $sort: { totalSpent: -1 } },
            { $limit: 10 },
          ],

          dailyStats: [
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: '%Y-%m-%d',
                    date: { $toDate: '$date' },
                  },
                },
                totalAmount: { $sum: '$amount' },
                income: {
                  $sum: { $cond: [{ $gt: ['$amount', 0] }, '$amount', 0] },
                },
                expenses: {
                  $sum: { $cond: [{ $lt: ['$amount', 0] }, '$amount', 0] },
                },
                transactionCount: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ];

    const result = await Transaction.aggregate(pipeline);
    const data = result[0];

    return {
      summary: data.totals[0] || {
        totalIncome: 0,
        totalExpenses: 0,
        totalTransactions: 0,
        largestIncome: 0,
        largestExpense: 0,
        avgTransactionAmount: 0,
      },
      lastTransaction: data.lastTransaction,
      categories: data.categories || [],
      paymentStats: data.paymentAnalysis[0] || {
        totalPayments: 0,
        paymentCount: 0,
        avgPayment: 0,
        payments: [],
      },
      recurringStats: data.recurringTransactions[0] || {
        totalRecurring: 0,
        count: 0,
        transactions: [],
      },
      lastTransaction: data.lastTransaction[0] || null,
      topMerchants: data.merchantAnalysis || [],
      dailyStats: data.dailyStats || [],
    };
  } catch (error) {
    console.error('Error in aggregateAllTransactions:', error);
    throw error;
  }
}

async function transformAccountFormat(dbAccount) {
  try {
    const ins_details = await getInstitutionDetails(dbAccount.item_id);
    const transactionStats = await aggregateAllTransactions(
      dbAccount.account_id,
    );

    // Base transformation
    const baseTransform = {
      id: dbAccount._id,
      name: dbAccount.name || 'Account',
      type: dbAccount.subtype || dbAccount.type,
      number: dbAccount.mask,
      balances: {
        current: dbAccount.balances.current || 0,
        available: dbAccount.balances.available || 0,
        limit: dbAccount.balances.limit || 0,
      },
      statistics: {
        total: {
          income: transactionStats.summary.totalIncome,
          expenses: Math.abs(transactionStats.summary.totalExpenses),
          transactions: transactionStats.summary.totalTransactions,
          net:
            transactionStats.summary.totalIncome +
            transactionStats.summary.totalExpenses,
        },
        transactions: {
          count: transactionStats.summary.totalTransactions,
          averageAmount: Math.abs(
            transactionStats.summary.avgTransactionAmount,
          ),
          largest: {
            income: transactionStats.summary.largestIncome,
            expense: Math.abs(transactionStats.summary.largestExpense),
          },
          latestTransactionAmount:
            transactionStats.summary.latestTransactionAmount,
        },
        lastTransaction: transactionStats.lastTransaction,
        categories: transactionStats.categories.map((cat) => ({
          name: cat._id,
          total: Math.abs(cat.totalAmount),
          count: cat.count,
          average: Math.abs(cat.averageAmount),
          category_url: cat.iconUrl,
          percentage:
            (Math.abs(cat.totalAmount) /
              (cat.totalAmount > 0
                ? transactionStats.summary.totalIncome
                : Math.abs(transactionStats.summary.totalExpenses))) *
            100,
        })),
        merchants: transactionStats.topMerchants.map((merchant) => ({
          name: merchant._id,
          totalSpent: merchant.totalSpent,
          frequency: merchant.frequency,
          averageSpend: merchant.avgSpend,
        })),
      },
      ConnectionType: dbAccount.accountType,
      institution: ins_details,
      currency: dbAccount.balances.iso_currency_code || 'USD',
    };

    // Account type specific transformations
    switch (dbAccount.type.toLowerCase()) {
      case 'checking':
        return {
          ...baseTransform,
          spendingAnalysis: {
            total: Math.abs(transactionStats.summary.totalExpenses),
            categories: transactionStats.categories
              .filter((cat) => cat.totalAmount < 0)
              .map((cat) => ({
                category: cat._id,
                amount: Math.abs(cat.totalAmount),
                frequency: cat.count,
                averageAmount: Math.abs(cat.averageAmount),
              })),
            merchants: transactionStats.topMerchants,
            billPayments: {
              total: transactionStats.paymentStats.totalPayments,
              count: transactionStats.paymentStats.paymentCount,
              average: transactionStats.paymentStats.avgPayment,
            },
            recurring: {
              total: transactionStats.recurringStats.totalRecurring,
              count: transactionStats.recurringStats.count,
            },
          },
        };

      case 'savings':
        const savingsStats = {
          deposits: {
            total: transactionStats.summary.totalIncome,
            count: transactionStats.categories
              .filter((cat) => cat.totalAmount > 0)
              .reduce((sum, cat) => sum + cat.count, 0),
            average:
              transactionStats.summary.totalIncome /
              Math.max(
                1,
                transactionStats.categories
                  .filter((cat) => cat.totalAmount > 0)
                  .reduce((sum, cat) => sum + cat.count, 0),
              ),
            largest: transactionStats.summary.largestIncome,
          },
          withdrawals: {
            total: Math.abs(transactionStats.summary.totalExpenses),
            count: transactionStats.categories
              .filter((cat) => cat.totalAmount < 0)
              .reduce((sum, cat) => sum + cat.count, 0),
            average:
              Math.abs(transactionStats.summary.totalExpenses) /
              Math.max(
                1,
                transactionStats.categories
                  .filter((cat) => cat.totalAmount < 0)
                  .reduce((sum, cat) => sum + cat.count, 0),
              ),
          },
          savingsRate: calculateSavingsRate(
            transactionStats.summary.totalIncome,
            Math.abs(transactionStats.summary.totalExpenses),
          ),
        };

        return {
          ...baseTransform,
          savingsAnalysis: savingsStats,
        };

      case 'credit':
        const currentBalance = Math.abs(dbAccount.balances.current || 0);
        const creditLimit = dbAccount.balances.limit || 0;

        return {
          ...baseTransform,
          creditAnalysis: {
            balance: {
              current: currentBalance,
              limit: creditLimit,
              available: creditLimit - currentBalance,
              utilization: calculateCreditUtilization(
                currentBalance,
                creditLimit,
              ),
            },
            spending: {
              total: Math.abs(transactionStats.summary.totalExpenses),
              byCategory: transactionStats.categories
                .filter((cat) => cat.totalAmount < 0)
                .map((cat) => ({
                  category: cat._id,
                  amount: Math.abs(cat.totalAmount),
                  percentage:
                    (Math.abs(cat.totalAmount) /
                      Math.abs(transactionStats.summary.totalExpenses)) *
                    100,
                })),
              byMerchant: transactionStats.topMerchants,
            },
            payments: {
              total: transactionStats.paymentStats.totalPayments,
              count: transactionStats.paymentStats.paymentCount,
              average: transactionStats.paymentStats.avgPayment,
            },
            rewards: {
              total: Math.floor(
                Math.abs(transactionStats.summary.totalExpenses),
              ),
            },
          },
        };

      default:
        return baseTransform;
    }
  } catch (error) {
    console.error('Error in transformAccountFormat:', error);
    throw error;
  }
}

module.exports = {
  transformAccountFormat,
  calculateCreditUtilization,
  calculateSavingsRate,
  aggregateAllTransactions,
};
