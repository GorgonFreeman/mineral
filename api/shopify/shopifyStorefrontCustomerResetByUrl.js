// https://shopify.dev/docs/api/storefront/latest/mutations/customerResetByUrl

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
  ['resetUrl'],
  ['password'],
]);

const shopifyStorefrontCustomerResetByUrl = async (
  credsPayload,
  resetUrl,
  password,
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
    resetUrl,
    password,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyStorefrontMutationDo(
    credsPayload,
    'customerResetByUrl',
    {
      mutationVariables: {
        resetUrl: {
          type: 'URL!',
          value: resetUrl,
        },
        password: {
          type: 'String!',
          value: password,
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
  shopifyStorefrontCustomerResetByUrl,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontCustomerResetByUrl" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "resetUrl": "https://example.com/account/reset/xxx/yyy",
    "password": "NewSecurePass123"
  }'
*/
