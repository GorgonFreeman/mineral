// https://shopify.dev/docs/api/storefront/latest/mutations/customerAccessTokenCreateWithMultipass

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { shopifyStorefrontMutationDo } = require('./shopifyStorefrontMutationDo');

const defaultReturnAccessTokenAttrs = `
accessToken
  expiresAt
`.trim();

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['multipassToken'],
]);

const shopifyStorefrontCustomerAccessTokenCreateWithMultipass = async (
  credsPayload,
  multipassToken,
  {
    apiVersion,
    returnAccessTokenAttrs = defaultReturnAccessTokenAttrs,
    inContext,
    fetchClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    multipassToken,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyStorefrontMutationDo(
    credsPayload,
    'customerAccessTokenCreateWithMultipass',
    {
      mutationVariables: {
        multipassToken: {
          type: 'String!',
          value: multipassToken,
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
  shopifyStorefrontCustomerAccessTokenCreateWithMultipass,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontCustomerAccessTokenCreateWithMultipass" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "multipassToken": "multipass-token-here"
  }'
*/
