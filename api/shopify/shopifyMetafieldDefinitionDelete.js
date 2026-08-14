// https://shopify.dev/docs/api/admin-graphql/latest/mutations/metafieldDefinitionDelete

const { credsValidator } = require('../validators');
const { ArgsWarden, valueProvided } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopifyMutationDo');

const metafieldDefinitionIdentifierValidator = (metafieldDefinitionIdentifier) => {
  const { 
    id,
    key,
    namespace,
    ownerType,
  } = metafieldDefinitionIdentifier;
  return (key && namespace && ownerType)
    || valueProvided(id);
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['metafieldDefinitionIdentifier', metafieldDefinitionIdentifierValidator],
]);

const shopifyMetafieldDefinitionDelete = async (
  credsPayload,
  metafieldDefinitionIdentifier,
  {
    apiVersion,
    returnSchema = 'deletedThingId',
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    metafieldDefinitionIdentifier,
  });
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
  argsWarden,
};

module.exports = {
  shopifyMetafieldDefinitionDelete,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyMetafieldDefinitionDelete" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "thingId": "104188477512"
  }'
*/
