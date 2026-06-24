const { credsFromPayload, logDeep } = require('../utils');
const { credsValidator } = require('../validators');
const { shopifyFetchClient } = require('./shopify.utils');

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

  const orderGid = `gid://shopify/Order/${ orderId }`;

  const response = await shopifyFetchClient.fetch({
    method: 'post',
    body: {
      query: `query { order(id: "${ orderGid }") { id name createdAt displayFinancialStatus displayFulfillmentStatus } }`,
    },
    context: {
      creds,
    },
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
