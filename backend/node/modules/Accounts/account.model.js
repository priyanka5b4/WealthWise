const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const accountSchema = new Schema({
  item_id: { type: String, ref: 'items', required: true }, // Reference to Item
  account_id: { type: String, required: true, unique: true },
  persistent_account_id: { type: String, required: true },
  mask: String,
  name: String,
  official_name: String,
  type: { type: String, required: true },
  subtype: String,
  balances: {
    available: Number,
    current: Number,
    limit: Number,
    iso_currency_code: String,
    unofficial_currency_code: String,
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  accountType: String,
});

module.exports = mongoose.model('Account', accountSchema);
