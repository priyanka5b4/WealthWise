const express = require('express');
const router = express.Router();
const Transaction = require('./transaction.model');
const transactionController = require('./transaction.controller');
const {
    getCategoryColorClasses,
  } = require('../utils/getCategoryColors');

router.post('/bulk', transactionController.createBulkTransactions);
router.get('/', async function (req, res) {
    try {
      let transactions = await Transaction.find({});
      const transactionWithColor = transactions.map((transaction) => ({
        ...transaction.toObject(), // Convert mongoose doc to plain object
        color: getCategoryColorClasses(
          transaction.personal_finance_category?.primary || 'GENERAL_MERCHANDISE'
        ),
      }));
      res.json(transactionWithColor);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

module.exports = router;
