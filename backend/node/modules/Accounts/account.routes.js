const express = require('express');
const router = express.Router();
const accountController = require('./account.controller');
const Account = require('./account.model');
const Transaction = require('../Transactions/transaction.model');
const accountService = require('./account.service');
const ItemService = require('../Items/Item.service');
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
const { transformAccountForAPI } = require('./account.utility');
const Item = require('../Items/Item.model');

const plaidClient = new PlaidApi(
  new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
        'PLAID-SECRET': process.env.PLAID_SECRET,
      },
    },
  }),
);

// Get all accounts
// router.get('/', accountController.getAccounts);

router.get('/', async (req, res) => {
  try {
    const accounts = await Account.find({});
    const Item = require('../Items/Item.model');

    // Transform accounts with proper field mapping
    const transformedAccounts = await Promise.all(
      accounts.map(async (account) => {
        // Get institution info
        let institution = null;
        if (account.item_id) {
          const item = await Item.findOne({ item_id: account.item_id });
          if (item) {
            institution = {
              institution_id: item.institution_id,
              name: item.institution_name,
              logo: null,
            };
          }
        }

        return {
          account_id: account.account_id,
          id: account.account_id, // For backward compatibility
          item_id: account.item_id,
          persistent_account_id: account.persistent_account_id,

          name: account.name,
          official_name: account.official_name,
          mask: account.mask || account.account_id.slice(-4),
          type: account.type.toLowerCase(),
          subtype: account.subtype,

          balances: {
            available: account.balances.available,
            current: account.balances.current,
            limit: account.balances.limit,
            previous: account.balances.previous || account.balances.current,
            iso_currency_code: account.balances.iso_currency_code || 'USD',
            unofficial_currency_code: account.balances.unofficial_currency_code,
          },

          status: account.status || 'active',
          connection_type: account.connection_type.toLowerCase(),
          institution,

          created_at: account.created_at.toISOString(),
          updated_at: account.updated_at.toISOString(),
        };
      }),
    );

    res.json(transformedAccounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/save', async (req, res) => {
  try {
    const { item_id, accounts, institution } = req.body;

    const savedAccounts = await Promise.all(
      accounts.map(async (account) => {
        const accountData = {
          item_id,
          account_id: account.account_id,
          name: account.name,
          official_name: account.official_name,
          type: account.type,
          subtype: account.subtype,
          mask: account.mask,
          balances: account.balances,
          connection_type: 'plaid',
          status: 'active',
        };

        return await Account.findOneAndUpdate(
          { account_id: account.account_id },
          accountData,
          { upsert: true, new: true },
        );
      }),
    );

    res.json(savedAccounts);
  } catch (error) {
    console.error('Error saving accounts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new account
router.post('/', async (req, res) => {
  try {
    const accountData = req.body;

    // Ensure connection_type is set for manual accounts
    accountData.connection_type = 'manual';

    // Generate a unique account_id for manual accounts
    accountData.account_id = `manual_${Date.now()}`;
    accountData.item_id = `manual_${Date.now()}`;
    accountData.persistent_account_id = accountData.account_id;

    // Set default status if not provided
    accountData.status = accountData.status || 'active';

    // Ensure balances are properly structured
    accountData.balances = {
      available: accountData.balances?.available || 0,
      current: accountData.balances?.current || 0,
      limit: accountData.balances?.limit || null,
      previous: accountData.balances?.current || 0,
      iso_currency_code: accountData.balances?.iso_currency_code || 'USD',
      unofficial_currency_code: accountData.balances?.unofficial_currency_code,
    };

    // Create the account
    const account = new Account(accountData);
    await account.save();

    // Transform the saved account to include institution info
    const transformedAccount = {
      ...account.toJSON(),
      institution: {
        institution_id: 'manual',
        name: 'Manual Entry',
        logo: null,
      },
    };

    res.status(201).json(transformedAccount);
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(400).json({
      message: error.message,
      details: Object.values(error.errors || {}).map((err) => err.message),
    });
  }
});

// Refresh account from Plaid
router.post('/:accountId/refresh', async (req, res) => {
  try {
    const { accountId } = req.params;

    // Find the account and its associated item
    const account = await Account.findOne({ account_id: accountId });
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // If it's a manual account, just return the current data
    if (account.connection_type === 'manual') {
      return res.json(account);
    }

    const Item = require('../Items/Item.model');
    const item = await Item.findOne({ item_id: account.item_id });
    if (!item) {
      return res.status(404).json({ error: 'Associated item not found' });
    }

    // Get fresh account data from Plaid
    const accountsResponse = await plaidClient.accountsGet({
      access_token: item.access_token,
    });

    // Find the matching account in Plaid's response
    const plaidAccount = accountsResponse.data.accounts.find(
      (acc) => acc.account_id === accountId,
    );

    if (!plaidAccount) {
      return res.status(404).json({ error: 'Account not found in Plaid' });
    }

    // Get latest transactions from Plaid
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Get last 30 days of transactions
    const endDate = new Date();

    const transactionsResponse = await plaidClient.transactionsGet({
      access_token: item.access_token,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      options: {
        account_ids: [accountId],
      },
    });

    const Transaction = require('../Transactions/transaction.model');
    const transactions = transactionsResponse.data.transactions;

    // Update or insert new transactions
    for (const plaidTx of transactions) {
      // Create datetime from date if not provided
      const txDate = new Date(plaidTx.date);
      const datetime = plaidTx.datetime
        ? new Date(plaidTx.datetime)
        : new Date(txDate.setHours(12, 0, 0, 0));

      await Transaction.findOneAndUpdate(
        { transaction_id: plaidTx.transaction_id },
        {
          $set: {
            account_id: plaidTx.account_id,
            transaction_id: plaidTx.transaction_id,
            amount: plaidTx.amount,
            date: plaidTx.date,
            datetime: datetime,
            name: plaidTx.name,
            merchant_name: plaidTx.merchant_name,
            payment_channel: plaidTx.payment_channel,
            pending: plaidTx.pending,
            category: plaidTx.category,
            category_id: plaidTx.category_id,
            transaction_type: plaidTx.transaction_type || 'special',
            iso_currency_code: plaidTx.iso_currency_code,
            unofficial_currency_code: plaidTx.unofficial_currency_code,
            location: plaidTx.location,
            payment_meta: plaidTx.payment_meta,
            authorized_date: plaidTx.authorized_date,
            authorized_datetime: plaidTx.authorized_datetime,
            source: 'plaid',
            updated_at: new Date(),
          },
        },
        { upsert: true, new: true },
      );
    }

    // Update the account in our database
    const updatedAccount = await Account.findOneAndUpdate(
      { account_id: accountId },
      {
        $set: {
          balances: {
            available: plaidAccount.balances.available,
            current: plaidAccount.balances.current,
            limit: plaidAccount.balances.limit,
            iso_currency_code: plaidAccount.balances.iso_currency_code,
            unofficial_currency_code:
              plaidAccount.balances.unofficial_currency_code,
            previous: account.balances.current, // Store the previous balance
          },
          mask: plaidAccount.mask,
          name: plaidAccount.name,
          official_name: plaidAccount.official_name,
          type: plaidAccount.type,
          subtype: plaidAccount.subtype,
          updated_at: new Date(),
        },
      },
      { new: true },
    );

    // Transform the account data for frontend
    const transformedAccount = await transformAccountForAPI(updatedAccount);

    res.json({
      account: transformedAccount,
      transactionsUpdated: transactions.length,
    });
  } catch (error) {
    console.error('Error refreshing account:', error);
    res.status(500).json({ error: 'Failed to refresh account' });
  }
});

// Delete account
router.delete('/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;

    // Find the account to get the item_id
    const account = await Account.findOne({
      $or: [{ account_id: accountId }, { id: accountId }],
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const itemId = account.item_id;

    // Delete the account
    await Account.deleteOne({
      $or: [{ account_id: accountId }, { id: accountId }],
    });

    // Delete associated transactions
    await Transaction.deleteMany({ account_id: accountId });

    // Check if this was the last account for this item
    const remainingAccounts = await Account.countDocuments({ item_id: itemId });

    if (remainingAccounts === 0) {
      console.log(`No remaining accounts for item ${itemId}, deleting item...`);

      // Get the item before deletion for logging
      const item = await Item.findOne({ item_id: itemId });

      if (item) {
        console.log(
          `Found item to delete: ${item.item_id} (${item.institution_name})`,
        );
        // Delete the item
        await Item.deleteOne({ item_id: itemId });
        console.log(`Successfully deleted item ${itemId}`);
      } else {
        console.log(`No item found with id ${itemId}`);
      }
    } else {
      console.log(
        `${remainingAccounts} accounts still remaining for item ${itemId}`,
      );
    }

    res.json({
      message: 'Account deleted successfully',
      itemDeleted: remainingAccounts === 0,
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get account by ID
router.get('/:accountId', accountController.getAccount);

module.exports = router;
