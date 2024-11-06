const transactionService = require("./transaction.service");
const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const transactions = await transactionService.getAll();
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
