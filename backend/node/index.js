const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const plaid_service = require('./plaid_service');
const db_service = require('./db_service');
const db = require('./core/dbLib/db.connect');
const Item = require('./modules/Items/Item.model');
const Account = require('./modules/Accounts/account.model');
const Transaction = require('./modules/Transactions/transaction.model');
db.connect(true);

require('dotenv').config();
const PLAID_PRODUCTS = (process.env.PLAID_PRODUCTS || 'transactions').split(
  ',',
);

let ACCESS_TOKEN = null;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.listen(8000, () => {
  console.log('Server is running on port 8000');
});

app.use('/api/transactions', async function (req, res, next) {
  try {
    const transactions = await Transaction.find({});
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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
    PUBLIC_TOKEN = request.body.public_token;
    plaid_service.setAccessToken(PUBLIC_TOKEN).then(async (res) => {
      // prettyPrintResponse(res.data);
      // console.log(res.data);
      ACCESS_TOKEN = res.data.access_token;

      // Inserting account details
      await db_service.InsertNewItemDetails(
        res.data.item_id,
        res.data.access_token,
      );

      // inserting transaction details
      await db_service.InsertTransactionDetails(res.data.access_token);

      return response.json(res.data);
    });
  } catch (err) {
    console.log(err);
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
