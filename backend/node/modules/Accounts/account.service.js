const datamodel = require('../../core/dbLib/data.service');
const Account = require('./account.model');
const { getInstitutionDetails } = require('../Items/Item.service');
const { transformAccountFormat } = require('../Accounts/account.utility');

module.exports.createAccount = async (newAccount) => {
  try {
    const tAccount = new Account(newAccount);
    await tAccount.save();
    return tAccount;
  } catch (err) {
    console.log(err);
    throw new Error(
      `Error inserting account details for account ID: ${newAccount.account_id} in mongo db: ${err}`,
    );
  }
};

module.exports.getAllAccountsWIthId = async (item_id) => {
  try {
    const accounts = await Account.find({ item_id: item_id });
    return accounts;
  } catch (err) {
    console.log(err);
    throw new Error(`Error getting account details for item_id : ${item_id}`);
  }
};

module.exports.getAllAccounts = async () => {
  try {
    const response = await Account.find({});
    //console.log(response);
    if (response.length) {
      let transformedAccounts = [];
      for (account in response) {
        // console.log(account);
        transformedAccounts.push(
          await transformAccountFormat(response[account]),
        );
      }
      //console.log(transformedAccounts);
      return transformedAccounts;
    }
    return response;
  } catch (err) {
    console.log(err);
    throw new Error(`Error getting account details`);
  }
};

module.exports.deleteAccount = async (accountId) => {
  try {
    console.log('Searching for account with ID:', accountId);
    
    // Find the account first to ensure it exists
    const account = await Account.findOne({ 
      $or: [
        { account_id: accountId },
        { persistent_account_id: accountId }
      ]
    });
    
    console.log('Account found:', account);
    
    if (!account) {
      throw new Error(`Account not found with ID: ${accountId}`);
    }

    // Delete all associated transactions
    const Transaction = require('../Transactions/transaction.model');
    await Transaction.deleteMany({ account_id: account.account_id });

    // Delete the account
    await Account.deleteOne({ account_id: account.account_id });

    return { success: true, message: 'Account and associated transactions deleted successfully' };
  } catch (err) {
    console.error('Error in deleteAccount service:', err);
    throw err;
  }
};
