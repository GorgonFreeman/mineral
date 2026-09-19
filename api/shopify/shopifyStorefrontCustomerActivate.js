// https://shopify.dev/docs/api/storefront/latest/mutations/customerActivate

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
  ['customerId'],
  ['input'],
]);

const shopifyStorefrontCustomerActivate = async (
  credsPayload,
  customerId,
  input,
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
    customerId,
    input,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const id = customerId.toString().startsWith('gid://')
    ? customerId
    : `gid://shopify/Customer/${ customerId }`;

  return shopifyStorefrontMutationDo(
    credsPayload,
    'customerActivate',
    {
      mutationVariables: {
        id: {
          type: 'ID!',
          value: id,
        },
        input: {
          type: 'CustomerActivateInput!',
          value: input,
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
  shopifyStorefrontCustomerActivate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontCustomerActivate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "customerId": "1234567890",
    "input": {
      "activationToken": "token",
      "password": "SecurePass123"
    }
  }'
*/
