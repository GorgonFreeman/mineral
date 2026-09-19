// https://shopify.dev/docs/api/storefront/latest/mutations/customerAccessTokenDelete

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { shopifyStorefrontMutationDo } = require('./shopifyStorefrontMutationDo');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['customerAccessToken'],
]);

const shopifyStorefrontCustomerAccessTokenDelete = async (
  credsPayload,
  customerAccessToken,
  {
    apiVersion,
    inContext,
    fetchClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    customerAccessToken,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyStorefrontMutationDo(
    credsPayload,
    'customerAccessTokenDelete',
    {
      mutationVariables: {
        customerAccessToken: {
          type: 'String!',
          value: customerAccessToken,
        },
      },
      returnSchema: `
        deletedAccessToken
        deletedCustomerAccessTokenId
      `.trim(),
      apiVersion,
      inContext,
      ...fetchClient ? { fetchClient } : {},
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyStorefrontCustomerAccessTokenDelete,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontCustomerAccessTokenDelete" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "customerAccessToken": "shcat_xxx"
  }'
*/
