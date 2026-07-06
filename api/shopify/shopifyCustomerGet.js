// https://shopify.dev/docs/api/admin-graphql/latest/queries/customer

const { credsValidator } = require('../validators');
const { responseIfRejectingArgs } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');

const defaultAttrs = 'id email';

const validatorsByArg = {
  credsPayload: credsValidator,
  customerId: Boolean,
};

const shopifyCustomerGet = async (
  credsPayload,
  customerId,
  {
    apiVersion,
    attrs = defaultAttrs,
  } = {},
) => {

  const rejectResponse = await responseIfRejectingArgs(validatorsByArg, { credsPayload, customerId });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyGetSingle(
    credsPayload,
    'customer',
    customerId,
    {
      apiVersion,
      attrs,
    },
  );
};

const funcApiConfig = {
  argNames: ['credsPayload', 'customerId'],
  validatorsByArg,
};

module.exports = {
  shopifyCustomerGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyCustomerGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "customerId": "8575963103304"
  }'
*/
