const datamodel = require('../../core/dbLib/data.service');
const Transaction = require('./transaction.model');
const utils = require('../../core/utils/utils');

module.exports.InsertTransaction = async (newTransaction) => {
  try {
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
