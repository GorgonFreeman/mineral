// https://shopify.dev/docs/api/storefront/latest/mutations/customerRecover

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { shopifyStorefrontMutationDo } = require('./shopifyStorefrontMutationDo');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['email'],
]);

const shopifyStorefrontCustomerRecover = async (
  credsPayload,
  email,
  {
    apiVersion,
    inContext,
    fetchClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    email,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyStorefrontMutationDo(
    credsPayload,
    'customerRecover',
    {
      mutationVariables: {
        email: {
          type: 'String!',
          value: email,
        },
      },
      returnSchema: '',
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
  shopifyStorefrontCustomerRecover,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontCustomerRecover" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "email": "buyer@example.com"
  }'
*/
