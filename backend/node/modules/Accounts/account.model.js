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
  // owners: [{
  //   names: [String],
  //   phone_numbers: [{
  //     data: String,
  //     primary: Boolean,
  //     type: String
  //   }],
  //   emails: [{
  //     data: String,
  //     primary: Boolean,
  //     type: String
  //   }],
  //   addresses: [{
  //     data: {
  //       street: String,
  //       city: String,
  //       region: String,
  //       postal_code: String,
  //       country: String
  //     },
  //     primary: Boolean
  //   }]
  // }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Account', accountSchema);
