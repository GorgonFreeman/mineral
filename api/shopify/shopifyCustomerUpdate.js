// https://shopify.dev/docs/api/admin-graphql/latest/mutations/customerUpdate

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopifyMutationDo');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['customerId', Boolean],
  ['updatePayload', Boolean],
]);

const defaultReturnCustomerAttrs = 'id email firstName lastName phone';

const shopifyCustomerUpdate = async (
  credsPayload,
  customerId,
  updatePayload,
  {
    apiVersion,
    returnCustomerAttrs = defaultReturnCustomerAttrs,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    customerId,
    updatePayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyMutationDo(
    credsPayload,
    'customerUpdate',
    {
      mutationVariables: {
        input: {
          type: 'CustomerInput!',
          value: {
            id: `gid://shopify/Customer/${ customerId }`,
            ...updatePayload,
          },
        },
      },
      returnSchema: `
        customer { ${ returnCustomerAttrs } }
      `.trim(),
      apiVersion,
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyCustomerUpdate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyCustomerUpdate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "customerId": "8575963103304",
    "updatePayload": {
      "firstName": "Winston",
      "lastName": "Churchill"
    }
  }'
*/
