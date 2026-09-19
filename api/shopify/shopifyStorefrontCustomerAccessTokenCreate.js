// https://shopify.dev/docs/api/storefront/latest/mutations/customerAccessTokenCreate

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { shopifyStorefrontMutationDo } = require('./shopifyStorefrontMutationDo');

const defaultReturnAccessTokenAttrs = `
accessToken
  expiresAt
`.trim();

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['input'],
]);

const shopifyStorefrontCustomerAccessTokenCreate = async (
  credsPayload,
  input,
  {
    apiVersion,
    returnAccessTokenAttrs = defaultReturnAccessTokenAttrs,
    inContext,
    fetchClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    input,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyStorefrontMutationDo(
    credsPayload,
    'customerAccessTokenCreate',
    {
      mutationVariables: {
        input: {
          type: 'CustomerAccessTokenCreateInput!',
          value: input,
        },
      },
      returnSchema: `
        customerAccessToken { ${ returnAccessTokenAttrs } }
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
  shopifyStorefrontCustomerAccessTokenCreate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontCustomerAccessTokenCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "input": {
      "email": "buyer@example.com",
      "password": "SecurePass123"
    }
  }'
*/
