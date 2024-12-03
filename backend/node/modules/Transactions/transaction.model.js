// transaction.model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const locationSchema = new Schema({
  address: String,
  city: String,
  region: String,
  postal_code: String,
  country: String,
  lat: Number,
  lon: Number,
  store_number: String,
}, { _id: false });

const paymentMetaSchema = new Schema({
  by_order_of: String,
  payee: String,
  payer: String,
  payment_method: String,
  payment_processor: String,
  ppd_id: String,
  reason: String,
  reference_number: String,
}, { _id: false });

const counterpartySchema = new Schema({
  name: String,
  type: String,
  entity_id: String,
  confidence_level: {
    type: String,
    enum: ['VERY_HIGH', 'HIGH', 'MEDIUM', 'LOW']
  },
  logo_url: String,
  website: String,
  phone_number: String,
}, { _id: false });

const personalFinanceCategorySchema = new Schema({
  primary: {
    type: String,
    required: true,
    index: true
  },
  detailed: {
    type: String,
    required: true
  },
  confidence_level: {
    type: String,
    enum: ['VERY_HIGH', 'HIGH', 'MEDIUM', 'LOW', 'MANUAL'],
    default: 'LOW'
  }
}, { _id: false });

const transactionSchema = new Schema({
  // Core fields
  transaction_id: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  account_id: {
    type: String,
    required: true,
    ref: 'Account',
    index: true
  },
  amount: {
    type: Number,
    required: true,
    index: true,
    get: v => parseFloat(v.toFixed(2))
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  
  // Transaction details
  name: {
    type: String,
    required: true,
    index: true
  },
  merchant_name: String,
  description: String,
  
  // Categorization
  category: {
    type: [String],
    default: ['GENERAL_MERCHANDISE'],
    index: true
  },
  personal_finance_category: {
    type: personalFinanceCategorySchema,
    required: true,
    default: () => ({
      primary: 'GENERAL_MERCHANDISE',
      detailed: 'GENERAL_MERCHANDISE_OTHER',
      confidence_level: 'LOW'
    })
  },
  
  // Status and type
  status: {
    type: String,
    enum: ['pending', 'posted', 'cancelled'],
    default: 'posted',
    index: true
  },
  transaction_type: {
    type: String,
    enum: ['income', 'expense', 'transfer', 'special', 'place', 'unresolved'],
    index: true,
    default: 'expense'
  },
  
  // Additional metadata
  datetime: Date,
  authorized_date: Date,
  authorized_datetime: Date,
  logo_url: String,
  website: String,
  payment_meta: {
    type: paymentMetaSchema,
    default: () => ({})
  },
  payment_channel: {
    type: String,
    enum: ['online', 'in store', 'other', 'recurring'],
    default: 'other'
  },
  pending_transaction_id: String,
  transaction_code: String,
  
  // Location and counterparties
  location: {
    type: locationSchema,
    default: () => ({})
  },
  counterparties: {
    type: [counterpartySchema],
    default: () => []
  },
  
  // Currency
  iso_currency_code: {
    type: String,
    default: 'USD'
  },
  unofficial_currency_code: String,
  
  // Source tracking
  source: {
    type: String,
    enum: ['plaid', 'manual', 'import'],
    required: true,
    default: 'plaid',
    index: true
  },
  
  // Timestamps
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Add compound indexes for common queries
transactionSchema.index({ account_id: 1, date: -1 });
transactionSchema.index({ account_id: 1, status: 1 });
transactionSchema.index({ source: 1, date: -1 });
transactionSchema.index({ account_id: 1, transaction_type: 1, date: -1 });
transactionSchema.index({ account_id: 1, 'personal_finance_category.primary': 1 });

// Pre-save middleware
transactionSchema.pre('save', function(next) {
  // Convert string dates to Date objects
  if (this.date && typeof this.date === 'string') {
    this.date = new Date(this.date);
  }
  if (this.datetime && typeof this.datetime === 'string') {
    this.datetime = new Date(this.datetime);
  }
  if (this.authorized_date && typeof this.authorized_date === 'string') {
    this.authorized_date = new Date(this.authorized_date);
  }
  if (this.authorized_datetime && typeof this.authorized_datetime === 'string') {
    this.authorized_datetime = new Date(this.authorized_datetime);
  }

  // Set transaction type based on amount if not set
  if (!this.transaction_type) {
    this.transaction_type = this.amount > 0 ? 'income' : 'expense';
  }

  // Set source if not set
  if (!this.source) {
    this.source = this.manual ? 'manual' : 'plaid';
  }

  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
