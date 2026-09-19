// https://shopify.dev/docs/api/storefront/latest/mutations/customerUpdate

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { shopifyStorefrontMutationDo } = require('./shopifyStorefrontMutationDo');

const defaultReturnCustomerAttrs = `
id
  email
  firstName
  lastName
  displayName
  phone
`.trim();

const defaultReturnAccessTokenAttrs = `
accessToken
  expiresAt
`.trim();

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['customerAccessToken'],
  ['customer'],
]);

const shopifyStorefrontCustomerUpdate = async (
  credsPayload,
  customerAccessToken,
  customer,
  {
    apiVersion,
    returnCustomerAttrs = defaultReturnCustomerAttrs,
    returnAccessTokenAttrs = defaultReturnAccessTokenAttrs,
    inContext,
    fetchClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    customerAccessToken,
    customer,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyStorefrontMutationDo(
    credsPayload,
    'customerUpdate',
    {
      mutationVariables: {
        customerAccessToken: {
          type: 'String!',
          value: customerAccessToken,
        },
        customer: {
          type: 'CustomerUpdateInput!',
          value: customer,
        },
      },
      returnSchema: `
        customer { ${ returnCustomerAttrs } }
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
  shopifyStorefrontCustomerUpdate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontCustomerUpdate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "customerAccessToken": "shcat_xxx",
    "customer": {
      "firstName": "Jane"
    }
  }'
*/
