const { credsFromPayload, customFetch, logDeep, FetchClient } = require('../utils');
const { credsValidator } = require('../validators');
const { shopifyResponseHandler } = require('./shopify.utils');

const shopifyOrderGet = async (
  credsPayload,
  orderId,
) => {

  if (!credsValidator(credsPayload)) {
    return {
      ok: false,
      error: {
        code: 'INVALID_ARGS',
        message: 'Invalid creds',
      },
    };
  }

  const creds = credsFromPayload(credsPayload);

  const {
    STORE_HANDLE,
    API_KEY,
  } = creds;

  const orderGid = `gid://shopify/Order/${ orderId }`;

  const shopifyFetchClient = new FetchClient({
    url: `https://${ STORE_HANDLE }.myshopify.com/admin/api/2024-10/graphql.json`,
    headers: {
      'X-Shopify-Access-Token': API_KEY,
    },
  });

  const response = await shopifyFetchClient.fetch({
    method: 'POST',
    body: {
      query: `query { order(id: "${ orderGid }") { id name createdAt displayFinancialStatus displayFulfillmentStatus } }`,
    },
    responseInterpreter: shopifyResponseHandler,
  });

  if (!response.ok) {
    return response;
  }

  logDeep('response', response);
  return response;
};

module.exports = {
  shopifyOrderGet,
};
