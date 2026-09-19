// https://shopify.dev/docs/api/storefront/latest/mutations/customerActivateByUrl

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
  ['activationUrl'],
  ['password'],
]);

const shopifyStorefrontCustomerActivateByUrl = async (
  credsPayload,
  activationUrl,
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
    activationUrl,
    password,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyStorefrontMutationDo(
    credsPayload,
    'customerActivateByUrl',
    {
      mutationVariables: {
        activationUrl: {
          type: 'URL!',
          value: activationUrl,
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
  shopifyStorefrontCustomerActivateByUrl,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontCustomerActivateByUrl" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "activationUrl": "https://example.com/account/activate/xxx/yyy",
    "password": "SecurePass123"
  }'
*/
