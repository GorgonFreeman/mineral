// https://shopify.dev/docs/api/storefront/latest/mutations/customerAddressUpdate

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
  ['addressId'],
  ['address'],
]);

const shopifyStorefrontCustomerAddressUpdate = async (
  credsPayload,
  customerAccessToken,
  addressId,
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
    addressId,
    address,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const id = addressId.toString().startsWith('gid://')
    ? addressId
    : `gid://shopify/MailingAddress/${ addressId }?model_name=CustomerAddress`;

  return shopifyStorefrontMutationDo(
    credsPayload,
    'customerAddressUpdate',
    {
      mutationVariables: {
        customerAccessToken: {
          type: 'String!',
          value: customerAccessToken,
        },
        id: {
          type: 'ID!',
          value: id,
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
  shopifyStorefrontCustomerAddressUpdate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontCustomerAddressUpdate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "customerAccessToken": "shcat_xxx",
    "addressId": "gid://shopify/MailingAddress/123?model_name=CustomerAddress",
    "address": { "city": "Melbourne" }
  }'
*/
