const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const plaid_service = require('./plaid_service');
const db_service = require('./db_service');
const db = require('./core/dbLib/db.connect');
const Item = require('./modules/Items/Item.model');
const Account = require('./modules/Accounts/account.model');
const Transaction = require('./modules/Transactions/transaction.model');
const accountService = require('./modules/Accounts/account.service');
const ItemService = require('./modules/Items/Item.service');
const transactionRoutes = require('./modules/Transactions/transaction.routes');
const transactionBulkRoutes = require('./modules/Transactions/transaction.bulk.routes');
const accountRoutes = require('./modules/Accounts/account.routes');

db.connect(true);

require('dotenv').config();
const PLAID_PRODUCTS = (process.env.PLAID_PRODUCTS || 'transactions').split(
  ',',
);

let ACCESS_TOKEN = null;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use('/api/dashboard', transactionRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionBulkRoutes);



app.post('/api/info', function (request, response, next) {
  response.json({
    products: PLAID_PRODUCTS,
  });
});

app.post('/api/create_link_token', async function (request, response, next) {
  try {
    plaid_service.createLinkToken().then((res) => {
      // prettyPrintResponse(res);
      return response.json(res.data);
    });
  } catch (err) {
    console.log(err);
  }
});

app.post('/api/set_access_token', async function (request, response, next) {
  try {
    const PUBLIC_TOKEN = request.body.public_token;
    const metadata = request.body.metadata;

    console.log('Received metadata:', metadata);

    // First check if this institution is already connected
    const existingItem = await Item.findOne({ 
      institution_id: metadata.institution.institution_id,
      // Add a status check to allow reconnecting closed/invalid items
      status: { $nin: ['CLOSED', 'INVALID'] }
    });

    if (existingItem) {
      console.log('Institution already connected:', existingItem);
      return response.status(409).json({ 
        error: 'This bank account is already connected. Please unlink the existing connection before adding it again.' 
      });
    }

    // Exchange public token for access token
    const tokenResponse = await plaid_service.setAccessToken(PUBLIC_TOKEN);
    const ACCESS_TOKEN = tokenResponse.data.access_token;
    const ITEM_ID = tokenResponse.data.item_id;

    console.log('Token exchange successful:', { item_id: ITEM_ID });

    try {
      // Save item details
      await db_service.InsertNewItemDetails(ITEM_ID, ACCESS_TOKEN);

      // Get accounts from Plaid
      const plaidAccounts = await plaid_service.getAccounts(ACCESS_TOKEN);
      console.log('Fetched accounts from Plaid:', plaidAccounts);

      // Save accounts
      const savedAccounts = await Promise.all(
        plaidAccounts.accounts.map(async (account) => {
          const accountData = {
            item_id: ITEM_ID,
            account_id: account.account_id,
            persistent_account_id: account.persistent_account_id || account.account_id,
            name: account.name,
            official_name: account.official_name,
            type: account.type.toLowerCase(),
            subtype: account.subtype?.toLowerCase(),
            mask: account.mask,
            balances: {
              available: account.balances.available || 0,
              current: account.balances.current || 0,
              limit: account.balances.limit || null,
              previous: account.balances.current || 0,
              iso_currency_code: account.balances.iso_currency_code || 'USD',
              unofficial_currency_code: account.balances.unofficial_currency_code
            },
            connection_type: 'plaid',
            status: 'active'
          };
          
          return await Account.findOneAndUpdate(
            { account_id: account.account_id },
            accountData,
            { upsert: true, new: true }
          );
        })
      );

      console.log('Saved accounts:', savedAccounts);

      // Get initial transactions
      await db_service.InsertTransactionDetails(ACCESS_TOKEN);

      // Return success response
      return response.json({
        access_token: ACCESS_TOKEN,
        item_id: ITEM_ID,
        accounts: savedAccounts
      });
    } catch (err) {
      console.error('Error in set_access_token:', err);
      return response.status(500).json({ error: err.message });
    }
  } catch (err) {
    console.error('Error in set_access_token:', err);
    return response.status(500).json({ error: err.message });
  }
});

app.get('/api/institutions', async (req, res) => {
  try {
    const items = await Item.find({});
    const itemIds = items.map((item) => item.item_id);

    // Fetching institution details and reconstructing item objects
    const enhancedItems = await Promise.all(
      items.map(async (item) => {
        try {
          const institution = await plaid_service.getInstitutionDetailsById(
            item.institution_id,
          );
          return {
            ...item.toObject(), // Use toObject() to safely manipulate Mongoose documents
            institution_name: institution.name,
            institution_url: institution.url,
          };
        } catch (instError) {
          console.error(
            `Failed to fetch details for institution ID ${item.institution_id}:`,
            instError,
          );
          return {
            ...item.toObject(),
            institution_name: `Error fetching details for institution ID ${item.institution_id}`,
            institution_url: '',
          };
        }
      }),
    );

    // Fetch accounts matching the item IDs
    const accounts = await Account.find({ item_id: { $in: itemIds } });

    // Combine items with their respective accounts
    const institutionsWithAccounts = enhancedItems.map((item) => ({
      ...item, // item already has all fields required, spread it directly
      accounts: accounts.filter(
        (acc) => acc.item_id.toString() === item.item_id.toString(),
      ),
    }));

    // console.log(institutionsWithAccounts);
    res.json(institutionsWithAccounts);
  } catch (error) {
    console.error('Error in processing the /api/institutions endpoint:', error);
    res.status(500).send('Internal Server Error');
  }
});



// In your backend API routes
app.post('/api/sync_accounts', async (req, res) => {
  try {
    const { item_id, access_token, institution, accounts } = req.body;
    
    // 1. Get accounts from Plaid
    const plaidResponse = await plaidClient.accountsGet({
      access_token: access_token
    });
    
    // 2. Transform and save accounts
    const savedAccounts = await Promise.all(
      plaidResponse.data.accounts.map(async (account) => {
        const accountData = {
          item_id,
          account_id: account.account_id,
          name: account.name,
          official_name: account.official_name,
          type: account.type,
          subtype: account.subtype,
          mask: account.mask,
          balances: account.balances,
          connection_type: 'plaid',
          status: 'active'
        };
        
        // Save to your database
        return await Account.findOneAndUpdate(
          { account_id: account.account_id },
          accountData,
          { upsert: true, new: true }
        );
      })
    );
    
    res.json(savedAccounts);
  } catch (error) {
    console.error('Error syncing accounts:', error);
    res.status(500).json({ error: error.message });
  }
});
app.post('/api/plaid/accounts', async (req, res) => {
  try {
    const { access_token } = req.body;
    const response = await plaidClient.accountsGet({ access_token });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching Plaid accounts:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/institutions/:institution_id', async (req, res) => {
  try {
    const { institution_id } = req.params;
    
    // Find the item for this institution
    const item = await Item.findOne({ institution_id });
    if (!item) {
      return res.status(404).json({ error: 'Institution not found' });
    }

    // Delete all accounts associated with this item
    await Account.deleteMany({ item_id: item.item_id });

    // Delete all transactions associated with these accounts
    await Transaction.deleteMany({ item_id: item.item_id });

    // Delete the item itself
    await Item.deleteOne({ institution_id });

    res.json({ message: 'Institution and all associated data deleted successfully' });
  } catch (error) {
    console.error('Error unlinking institution:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(8000, () => {
  console.log('Server is running on port 8000');
});
