require('dotenv').config();
const {
  Configuration,
  PlaidApi,
  Products,
  PlaidEnvironments,
} = require('plaid');

const prettyPrintResponse = (response) => {
  console.log(util.inspect(response.data, { colors: true, depth: 4 }));
};

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
const PLAID_SECRET = process.env.PLAID_SECRET;
const PLAID_ENV = process.env.PLAID_ENV || 'sandbox';
const util = require('util');
const { v4: uuidv4 } = require('uuid');

// PLAID_PRODUCTS is a comma-separated list of products to use when initializing
// Link. Note that this list must contain 'assets' in order for the app to be
// able to create and retrieve asset reports.
const PLAID_PRODUCTS = (
  process.env.PLAID_PRODUCTS || Products.Transactions
).split(',');

// PLAID_COUNTRY_CODES is a comma-separated list of countries for which users
// will be able to select institutions from.
const PLAID_COUNTRY_CODES = (process.env.PLAID_COUNTRY_CODES || 'US').split(
  ',',
);

// Parameters used for the OAuth redirect Link flow.
//
// Set PLAID_REDIRECT_URI to 'http://localhost:3000'
// The OAuth redirect flow requires an endpoint on the developer's website
// that the bank website should redirect to. You will need to configure
// this redirect URI for your client ID through the Plaid developer dashboard
// at https://dashboard.plaid.com/team/api.
const PLAID_REDIRECT_URI = process.env.PLAID_REDIRECT_URI || '';

// Parameter used for OAuth in Android. This should be the package name of your app,
// e.g. com.plaid.linksample
const PLAID_ANDROID_PACKAGE_NAME = process.env.PLAID_ANDROID_PACKAGE_NAME || '';

const configuration = new Configuration({
  basePath: PlaidEnvironments[PLAID_ENV],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
      'PLAID-SECRET': PLAID_SECRET,
      'Plaid-Version': '2020-09-14',
    },
  },
});

const client = new PlaidApi(configuration);

// creating link token

exports.createLinkToken = async () => {
  const configs = {
    user: {
      // This should correspond to a unique id for the current user.
      client_user_id: 'user-id',
    },
    client_name: 'Wealth Wise',
    products: PLAID_PRODUCTS,
    country_codes: PLAID_COUNTRY_CODES,
    language: 'en',
  };

  if (PLAID_REDIRECT_URI !== '') {
    configs.redirect_uri = PLAID_REDIRECT_URI;
  }

  if (PLAID_ANDROID_PACKAGE_NAME !== '') {
    configs.android_package_name = PLAID_ANDROID_PACKAGE_NAME;
  }

  const createTokenResponse = await client.linkTokenCreate(configs);
  prettyPrintResponse(createTokenResponse);
  return createTokenResponse;
};

// exchanging public token for access token

exports.setAccessToken = async (public_token) => {
  const tokenResponse = await client.itemPublicTokenExchange({
    public_token: public_token,
  });
  prettyPrintResponse(tokenResponse);
  return tokenResponse;
};

// getting account details with the transactions

exports.getAccountDetails = async (ACCESS_TOKEN) => {
  const accountsResponse = await client.accountsGet({
    access_token: ACCESS_TOKEN,
  });
  prettyPrintResponse(accountsResponse);
  return accountsResponse;
};

exports.getTransactions = async (ACCESS_TOKEN) => {
  let cursor = null;

  // New transaction updates since "cursor"
  let added = [];
  let modified = [];
  // Removed transaction ids
  let removed = [];
  let hasMore = true;
  // Iterate through each page of new transaction updates for item
  while (hasMore) {
    const request = {
      access_token: ACCESS_TOKEN,
      cursor: cursor,
    };
    const response = await client.transactionsSync(request);
    const data = response.data;
    // Add this page of results
    added = added.concat(data.added);
    modified = modified.concat(data.modified);
    removed = removed.concat(data.removed);
    hasMore = data.has_more;
    // Update cursor to the next cursor
    cursor = data.next_cursor;
    //prettyPrintResponse(response);
  }

  const compareTxnsByDateAscending = (a, b) =>
    (a.date > b.date) - (a.date < b.date);
  // Return the 8 most recent transactions
  const recently_added = [...added].sort(compareTxnsByDateAscending);
  return { latest_transactions: recently_added };
  return recently_added;
};

exports.getTrnsactionDetails = async (cursor, ACCESS_TOKEN) => {
  const request = {
    access_token: ACCESS_TOKEN,
    cursor: cursor,
  };
  const response = await client.transactionsSync(request);
  const data = response.data;
  // prettyPrintResponse(data);
  return response;
};

exports.getInstitutionDetailsById = async (institutionID) => {
  try {
    const Institutionrequest = {
      institution_id: institutionID,
      country_codes: ['US'],
    };
    const response = await client.institutionsGetById(Institutionrequest);
    const institution = response.data.institution;
    return institution;
  } catch (err) {
    console.log(err);
  }
};

exports.getAccounts = async (access_token) => {
  try {
    const response = await client.accountsGet({
      access_token: access_token
    });
    return response.data;
  } catch (error) {
    console.error('Error getting accounts from Plaid:', error);
    throw error;
  }
};