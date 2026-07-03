// https://shopify.dev/docs/api/admin-graphql/latest/mutations/pageDelete

const { credsValidator } = require('../validators');
const { responseIfRejectingArgs } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopifyMutationDo');

const validatorsByArg = {
  credsPayload: credsValidator,
  thingId: Boolean,
};

const FUNC = async (
  credsPayload,
  thingId,
  {
    apiVersion,
    returnSchema = 'deletedThingId',
  } = {},
) => {

  const rejectResponse = await responseIfRejectingArgs(validatorsByArg, { credsPayload, thingId });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyMutationDo(
    credsPayload,
    'thingDelete',
    {
      mutationVariables: {
        id: {
          type: 'ID!',
          value: `gid://shopify/Thing/${ thingId }`,
        },
      },
      returnSchema,
      apiVersion,
    },
  );
};

const funcApiConfig = {
  argNames: ['credsPayload', 'thingId'],
  validatorsByArg,
};

module.exports = {
  FUNC,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/FUNC" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "thingId": "104188477512"
  }'
*/
