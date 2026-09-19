// https://shopify.dev/docs/api/storefront/latest/mutations/customerAddressCreate

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { shopifyStorefrontMutationDo } = require('./shopifyStorefrontMutationDo');

const defaultReturnAddressAttrs = `
id
  address1
  address2
  city
  company
  country
  firstName
  lastName
  phone
  province
  zip
`.trim();

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['customerAccessToken'],
  ['address'],
]);

const shopifyStorefrontCustomerAddressCreate = async (
  credsPayload,
  customerAccessToken,
  address,
  {
    apiVersion,
    returnAddressAttrs = defaultReturnAddressAttrs,
    inContext,
    fetchClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    customerAccessToken,
    address,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyStorefrontMutationDo(
    credsPayload,
    'customerAddressCreate',
    {
      mutationVariables: {
        customerAccessToken: {
          type: 'String!',
          value: customerAccessToken,
        },
        address: {
          type: 'MailingAddressInput!',
          value: address,
        },
      },
      returnSchema: `
        customerAddress { ${ returnAddressAttrs } }
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
  shopifyStorefrontCustomerAddressCreate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontCustomerAddressCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "customerAccessToken": "shcat_xxx",
    "address": {
      "address1": "1 Main St",
      "city": "Sydney",
      "country": "Australia",
      "zip": "2000"
    }
  }'
*/
