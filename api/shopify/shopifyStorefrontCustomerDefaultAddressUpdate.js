// https://shopify.dev/docs/api/storefront/latest/mutations/customerDefaultAddressUpdate

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
  defaultAddress { id address1 city }
`.trim();

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['customerAccessToken'],
  ['addressId'],
]);

const shopifyStorefrontCustomerDefaultAddressUpdate = async (
  credsPayload,
  customerAccessToken,
  addressId,
  {
    apiVersion,
    returnCustomerAttrs = defaultReturnCustomerAttrs,
    inContext,
    fetchClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    customerAccessToken,
    addressId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const id = addressId.toString().startsWith('gid://')
    ? addressId
    : `gid://shopify/MailingAddress/${ addressId }?model_name=CustomerAddress`;

  return shopifyStorefrontMutationDo(
    credsPayload,
    'customerDefaultAddressUpdate',
    {
      mutationVariables: {
        customerAccessToken: {
          type: 'String!',
          value: customerAccessToken,
        },
        addressId: {
          type: 'ID!',
          value: id,
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
  shopifyStorefrontCustomerDefaultAddressUpdate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontCustomerDefaultAddressUpdate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "customerAccessToken": "shcat_xxx",
    "addressId": "gid://shopify/MailingAddress/123?model_name=CustomerAddress"
  }'
*/
