const { credsFromPayload } = require('../utils');
const { credsValidator } = require('../validators');

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

  const response = await fetch(
    `https://${ STORE_HANDLE }.myshopify.com/admin/api/2024-10/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': API_KEY,
      },
      body: JSON.stringify({
        query: `query { order(id: "${ orderGid }") { id name createdAt displayFinancialStatus displayFulfillmentStatus } }`,
      }),
    },
  );

  const responseData = await response.json();
  console.log('responseData', responseData);

  return responseData;
};

module.exports = {
  shopifyOrderGet,
};
