const Account = require('./account.model');
const { v4: uuidv4 } = require('uuid');

exports.getAccounts = async (req, res) => {
  try {
    const accounts = await Account.find({});
    
    // Calculate total balances and changes
    const accountsWithMetrics = accounts.map(account => {
      const current = account.balances.current || 0;
      const previous = account.balances.previous || current;
      const change = previous !== 0 ? ((current - previous) / Math.abs(previous)) * 100 : 0;
      
      return {
        id: account.account_id,
        name: account.name,
        official_name: account.official_name,
        type: account.type,
        subtype: account.subtype,
        number: account.mask,
        balances: account.balances,
        change: change,
        ConnectionType: account.item_id?.startsWith('manual_') ? 'Manual' : 'Plaid'
      };
    });

    res.status(200).json(accountsWithMetrics);
  } catch (error) {
    console.error('Error in getAccounts controller:', error); // Debug log
    res.status(500).json({
      message: 'Error fetching accounts',
      error: error.message
    });
  }
};

exports.createAccount = async (req, res) => {
  try {
    const { bankName, accountNumber, accountType, balance, creditLimit } = req.body;
    
    // Validate required fields
    if (!bankName || !accountNumber || !accountType) {
      return res.status(400).json({
        message: 'Missing required fields'
      });
    }

    // Map the account type to the existing schema
    let mappedType;
    let mappedSubtype;
    switch (accountType.toLowerCase()) {
      case 'checking':
        mappedType = 'depository';
        mappedSubtype = 'checking';
        break;
      case 'savings':
        mappedType = 'depository';
        mappedSubtype = 'savings';
        break;
      case 'credit_card':
        mappedType = 'credit';
        mappedSubtype = 'credit card';
        break;
      default:
        return res.status(400).json({
          message: 'Invalid account type'
        });
    }

    // Create account object mapping to existing schema
    const account = new Account({
      item_id: 'manual_' + uuidv4(), // Generate a unique item_id for manual accounts
      account_id: 'acc_' + uuidv4(), // Generate a unique account_id
      persistent_account_id: 'manual_' + uuidv4(),
      mask: accountNumber.slice(-4), // Last 4 digits of account number
      name: bankName,
      official_name: bankName,
      type: mappedType,
      subtype: mappedSubtype,
      connection_type: 'manual', // Set connection_type explicitly
      status: 'active', // Set default status
      balances: {
        available: ['checking', 'savings'].includes(accountType.toLowerCase()) ? balance : null,
        current: balance || 0,
        previous: balance || 0,
        limit: accountType.toLowerCase() === 'credit_card' ? creditLimit : null,
        iso_currency_code: 'USD',
      }
    });

    const savedAccount = await account.save();
    
    // Add institution info to response
    const accountWithInstitution = {
      ...savedAccount.toJSON(),
      institution: {
        institution_id: 'manual',
        name: 'Manual Entry',
        logo: null
      }
    };
    
    console.log('Account created:', accountWithInstitution);
    res.status(201).json(accountWithInstitution);
  } catch (error) {
    console.error('Error in createAccount controller:', error);
    res.status(400).json({
      message: error.message,
      details: error.errors ? Object.values(error.errors).map(e => e.message) : []
    });
  }
};

exports.getAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    const account = await Account.findOne({ account_id: accountId });
    
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    res.status(200).json({
      success: true,
      data: account
    });
  } catch (error) {
    console.error('Error in getAccount controller:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    console.log('Delete request received for account:', accountId);
    
    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: 'Account ID is required'
      });
    }

    await require('./account.service').deleteAccount(accountId);
    
    res.status(200).json({
      success: true,
      message: 'Account and associated transactions deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteAccount controller:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      message: error.message
    });
  }
};
