// https://shopify.dev/docs/api/admin-graphql/latest/mutations/customerCreate

const { credsValidator } = require('../validators');
const { responseIfRejectingArgs } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopifyMutationDo');

const thingInputValidator = (thingInput) => thingInput?.email;

const validatorsByArg = {
  credsPayload: credsValidator,
  thingInput: thingInputValidator,
};

const defaultReturnThingAttrs = 'id';

const shopifyThingCreate = async (
  credsPayload,
  thingInput,
  {
    apiVersion,
    returnThingAttrs = defaultReturnThingAttrs,
  } = {},
) => {

  const rejectResponse = await responseIfRejectingArgs(validatorsByArg, { 
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
  argNames: [
    'credsPayload', 
    'thingInput',
  ],
  validatorsByArg,
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
