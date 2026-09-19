// https://shopify.dev/docs/api/storefront/latest/mutations/customerAddressDelete

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { shopifyStorefrontMutationDo } = require('./shopifyStorefrontMutationDo');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['customerAccessToken'],
  ['addressId'],
]);

const shopifyStorefrontCustomerAddressDelete = async (
  credsPayload,
  customerAccessToken,
  addressId,
  {
    apiVersion,
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
    'customerAddressDelete',
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
      },
      returnSchema: `
        deletedCustomerAddressId
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
  shopifyStorefrontCustomerAddressDelete,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontCustomerAddressDelete" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "customerAccessToken": "shcat_xxx",
    "addressId": "gid://shopify/MailingAddress/123?model_name=CustomerAddress"
  }'
*/
