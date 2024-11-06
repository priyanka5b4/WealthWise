const datamodel = require('../../core/dbLib/data.service');
const Account = require('./account.model');
const utils = require('../../core/utils/utils');

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
