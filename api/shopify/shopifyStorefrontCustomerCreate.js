// https://shopify.dev/docs/api/storefront/latest/mutations/customerCreate

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

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['input'],
]);

const shopifyStorefrontCustomerCreate = async (
  credsPayload,
  input,
  {
    apiVersion,
    returnCustomerAttrs = defaultReturnCustomerAttrs,
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
    'customerCreate',
    {
      mutationVariables: {
        input: {
          type: 'CustomerCreateInput!',
          value: input,
        },
      },
      returnSchema: `
        customer { ${ returnCustomerAttrs } }
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
  shopifyStorefrontCustomerCreate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontCustomerCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "input": {
      "email": "buyer@example.com",
      "password": "SecurePass123"
    }
  }'
*/
