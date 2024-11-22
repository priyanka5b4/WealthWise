// transaction.model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const counterpartySchema = new Schema({
  confidence_level: String,
  entity_id: String,
  logo_url: String,
  name: String,
  phone_number: String,
  type: String,
  website: String,
});

const transactionSchema = new Schema({
  account_id: String,
  account_owner: String,
  amount: Number,
  iso_currency_code: String,
  unofficial_currency_code: String,
  category: [String],
  category_id: String,
  check_number: String,
  counterparties: [counterpartySchema],
  date: String,
  datetime: String,
  authorized_date: String,
  authorized_datetime: String,
  location: {
    address: String,
    city: String,
    region: String,
    postal_code: String,
    country: String,
    lat: Number,
    lon: Number,
    store_number: String,
  },
  name: String,
  merchant_name: String,
  merchant_entity_id: String,
  logo_url: String,
  website: String,
  payment_meta: {
    by_order_of: String,
    payee: String,
    payer: String,
    payment_method: String,
    payment_processor: String,
    ppd_id: String,
    reason: String,
    reference_number: String,
  },
  payment_channel: String,
  pending: Boolean,
  pending_transaction_id: String,
  personal_finance_category: {
    primary: String,
    detailed: String,
    confidence_level: String,
  },
  personal_finance_category_icon_url: String,
  transaction_id: { type: String, unique: true },
  transaction_code: String,
  transaction_type: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Add indexes for better query performance
transactionSchema.index({ account_id: 1, date: 1 });
transactionSchema.index({ pending: 1 });
transactionSchema.index({ 'personal_finance_category.primary': 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
