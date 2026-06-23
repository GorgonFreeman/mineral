const { credsFromPayload, customFetch, logDeep } = require('../utils');
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

  const fetchResponse = await customFetch(
    `https://${ STORE_HANDLE }.myshopify.com/admin/api/2024-10/graphql.json`,
    {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': API_KEY,
      },
      body: {
        query: `query { order(id: "${ orderGid }") { id name createdAt displayFinancialStatus displayFulfillmentStatus } }`,
      },
    },
  );

  const handledResponse = shopifyResponseHandler(fetchResponse, { resultPath: 'order' });

  if (!handledResponse.ok) {
    return handledResponse;
  }

  logDeep('handledResponse', handledResponse);
  return handledResponse;
};

module.exports = {
  shopifyOrderGet,
};
