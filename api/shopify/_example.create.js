// https://shopify.dev/docs/api/admin-graphql/latest/mutations/customerCreate

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopifyMutationDo');

const thingInputValidator = (thingInput) => thingInput?.email;

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['thingInput', thingInputValidator],
]);

const defaultReturnThingAttrs = 'id';

const shopifyThingCreate = async (
  credsPayload,
  thingInput,
  {
    apiVersion,
    returnThingAttrs = defaultReturnThingAttrs,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    thingInput,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyMutationDo(
    credsPayload,
    'thingCreate',
    {
      mutationVariables: {
        input: {
          type: 'ThingInput!',
          value: thingInput,
        },
      },
      returnSchema: `
        thing { ${ returnThingAttrs } }
      `.trim(),
      apiVersion,
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyThingCreate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyThingCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "thingInput": {
      ...
    }
  }'
*/
