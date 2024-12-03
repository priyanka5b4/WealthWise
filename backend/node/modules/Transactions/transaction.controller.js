const Transaction = require('./transaction.model');
const Account = require('../Accounts/account.model');
const { v4: uuidv4 } = require('uuid');
const TransactionService = require('./transaction.service');

// Helper function to validate transaction fields
const validateTransaction = (transaction) => {
  const errors = [];
  
  if (!transaction.date) errors.push('Missing date');
  if (transaction.amount === undefined || transaction.amount === null) errors.push('Missing amount');
  if (!transaction.name) errors.push('Missing name');
  if (!transaction.account_id) errors.push('Missing account_id');
  
  if (transaction.amount && isNaN(parseFloat(transaction.amount))) {
    errors.push('Invalid amount format');
  }
  if (transaction.date && !Date.parse(transaction.date)) {
    errors.push('Invalid date format');
  }
  
  return errors;
};

exports.createBulkTransactions = async (req, res) => {
  try {
    const { transactions } = req.body;
    if (!Array.isArray(transactions)) {
      throw new Error('Transactions must be provided as an array');
    }

    const batchSize = 100;
    const results = [];
    const errors = [];
    const processedAccounts = new Set();
    
    // Process transactions in batches
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      
      // Validate and process each transaction in the batch
      for (const transaction of batch) {
        try {
          // Validate transaction
          const validationErrors = validateTransaction(transaction);
          if (validationErrors.length > 0) {
            errors.push({
              transaction: transaction,
              errors: validationErrors
            });
            continue;
          }

          // Standardize the transaction amount
          transaction.amount = parseFloat(transaction.amount);

          // Mark as manual transaction
          transaction.manual = true;

          // Process the transaction
          const processedTransaction = await TransactionService.InsertTransaction(transaction);
          
          // Track processed account for later balance recalculation
          processedAccounts.add(transaction.account_id);

          results.push({
            success: true,
            transaction_id: processedTransaction.transaction_id,
            message: 'Transaction processed successfully'
          });
        } catch (error) {
          errors.push({
            transaction: transaction,
            errors: [error.message]
          });
        }
      }
    }

    // Recalculate balances for all affected accounts
    for (const accountId of processedAccounts) {
      try {
        const account = await Account.findOne({ account_id: accountId });
        if (!account) continue;

        // Get all non-pending transactions for this account
        const accountTransactions = await Transaction.find({
          account_id: accountId,
          $or: [
            { pending: false },
            { pending: { $exists: false } }
          ]
        }).sort({ date: 1 });

        // Reset balance to 0 and recalculate
        let runningBalance = 0;
        for (const trans of accountTransactions) {
          const amount = trans.amount;
          if (account.type.toLowerCase() === 'credit') {
            runningBalance += amount;
          } else {
            runningBalance += amount;
          }
        }

        // Update account balance
        account.balances.current = runningBalance;
        if (account.type.toLowerCase() === 'credit') {
          account.balances.available = (account.balances.limit || 0) - runningBalance;
        } else {
          account.balances.available = runningBalance;
        }
        await account.save();
      } catch (error) {
        console.error(`Error recalculating balance for account ${accountId}:`, error);
      }
    }

    // Return results
    return res.status(200).json({
      success: true,
      message: 'Bulk transaction processing completed',
      results: {
        total: transactions.length,
        successful: results.length,
        failed: errors.length,
        processed: results,
        errors: errors
      }
    });
  } catch (error) {
    console.error('Error processing bulk transactions:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing bulk transactions',
      error: error.message
    });
  }
};
