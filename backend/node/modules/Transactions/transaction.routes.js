const transactionService = require('./transaction.service');
const express = require('express');
const router = express.Router();

router.get('/networth', async (req, res) => {
  try {
    await transactionService.getNetWorthHistory(req, res);
  } catch (err) {
    res.status(500).json({ message: err.mesage });
  }
});

router.get('/IncomeExpenses', async (req, res) => {
  try {
    await transactionService.getIncomeExpenses(req, res);
  } catch (err) {
    res.status(500).json({ message: err.mesage });
  }
});

router.get('/categoryStats', async (req, res) => {
  try {
    await transactionService.getSpendingCategoriesAndStats(req, res);
  } catch (err) {
    res.status(500).json({ message: err.mesage });
  }
});

module.exports = router;
