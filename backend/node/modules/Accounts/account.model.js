const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const accountSchema = new Schema({
  account_id: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  item_id: { 
    type: String, 
    ref: 'items', 
    required: true,
    index: true 
  },
  persistent_account_id: { 
    type: String, 
    required: true 
  },
  
  name: { 
    type: String, 
    required: true 
  },
  official_name: String,
  mask: String,
  type: { 
    type: String, 
    required: true,
    enum: ['depository', 'credit', 'loan', 'investment', 'other'],
    index: true,
    set: v => v.toLowerCase()
  },
  subtype: { 
    type: String,
    enum: ['checking', 'savings', 'credit card', 'loan', 'investment', null],
    set: v => v ? v.toLowerCase() : null
  },
  
  balances: {
    available: { type: Number, default: 0 },
    current: { type: Number, required: true, default: 0 },
    limit: { type: Number, default: null },
    previous: { type: Number, default: 0 },
    iso_currency_code: { type: String, default: 'USD' },
    unofficial_currency_code: String,
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive', 'closed'],
    default: 'active',
    index: true
  },
  connection_type: {
    type: String,
    enum: ['manual', 'plaid'],
    required: true,
    index: true,
    set: v => v.toLowerCase()
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

accountSchema.index({ item_id: 1, status: 1 });
accountSchema.index({ type: 1, status: 1 });

// Virtual for frontend compatibility
accountSchema.virtual('id').get(function() {
  return this.account_id;
});

// Ensure virtuals are included in JSON
accountSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    // Convert timestamps to ISO strings
    if (ret.created_at) ret.created_at = ret.created_at.toISOString();
    if (ret.updated_at) ret.updated_at = ret.updated_at.toISOString();
    // Remove MongoDB specific fields
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// Pre-delete hook to check for item deletion
accountSchema.pre('deleteOne', { document: false, query: true }, async function() {
  try {
    // Get the account that's being deleted
    const filter = this.getFilter();
    const account = await this.model.findOne(filter);
    
    if (!account) {
      console.log('No account found for pre-delete hook');
      return;
    }

    const itemId = account.item_id;
    
    // Check remaining accounts after this deletion
    const remainingAccounts = await this.model.countDocuments({ 
      item_id: itemId,
      _id: { $ne: account._id } // Exclude current account
    });

    if (remainingAccounts === 0) {
      console.log(`Pre-delete hook: No remaining accounts for item ${itemId}, marking for deletion`);
      // Store item_id in query options for post-delete hook
      if (!this.options) this.options = {};
      this.options.itemToDelete = itemId;
    }
  } catch (error) {
    console.error('Error in account pre-delete hook:', error);
  }
});

// Post-delete hook to handle item deletion
accountSchema.post('deleteOne', { document: false, query: true }, async function() {
  try {
    if (this.options?.itemToDelete) {
      const Item = mongoose.model('Item');
      const itemId = this.options.itemToDelete;
      
      console.log(`Post-delete hook: Deleting item ${itemId}`);
      const item = await Item.findOne({ item_id: itemId });
      
      if (item) {
        console.log(`Found item to delete: ${item.item_id} (${item.institution_name})`);
        await Item.deleteOne({ item_id: itemId });
        console.log(`Successfully deleted item ${itemId}`);
      } else {
        console.log(`No item found with id ${itemId}`);
      }
    }
  } catch (error) {
    console.error('Error in account post-delete hook:', error);
  }
});

module.exports = mongoose.model('Account', accountSchema);
