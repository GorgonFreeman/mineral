// https://shopify.dev/docs/api/admin-graphql/latest/mutations/customerCreate

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopifyMutationDo');

const customerInputValidator = (customerInput) => customerInput?.email;

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['customerInput', customerInputValidator],
]);

const defaultReturnCustomerAttrs = 'id email';

const shopifyCustomerCreate = async (
  credsPayload,
  customerInput,
  {
    apiVersion,
    returnCustomerAttrs = defaultReturnCustomerAttrs,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({ 
    credsPayload, 
    customerInput,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyMutationDo(
    credsPayload,
    'customerCreate',
    {
      mutationVariables: {
        input: {
          type: 'CustomerInput!',
          value: customerInput,
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
  shopifyCustomerCreate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyCustomerCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "customerInput": {
      "email": "john+shopifyCustomerCreate@whitefoxboutique.com",
      "firstName": "Doctor",
      "lastName": "Manhattan"
    }
  }'
*/
