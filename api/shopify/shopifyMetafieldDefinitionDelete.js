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
    returnSchema = 'deletedDefinitionId',
    deleteAllAssociatedMetafields = false,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    metafieldDefinitionIdentifier,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const {
    id,
    key,
    namespace,
    ownerType,
  } = metafieldDefinitionIdentifier;

  return shopifyMutationDo(
    credsPayload,
    'metafieldDefinitionDelete',
    {
      mutationVariables: {
        ...(id && { id: {
          type: 'ID!',
          value: `gid://shopify/MetafieldDefinition/${ id }`,
        } }),
        ...((key && namespace && ownerType) && { 
          identifier: {
            type: 'MetafieldDefinitionIdentifierInput!',
            value: {
              key,
              namespace,
              ownerType,
            },
          },
        }),
        deleteAllAssociatedMetafields: {
          type: 'Boolean!',
          value: deleteAllAssociatedMetafields,
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
