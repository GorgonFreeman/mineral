// https://shopify.dev/docs/api/admin-graphql/latest/mutations/metafieldDefinitionCreate

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopifyMutationDo');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['ownerType'],
  ['namespace'],
  ['key'],
  ['name'],
  ['type'],
]);

const defaultReturnSchema = `
  createdDefinition {
    id
    name
    namespace
    key
    type {
      name
    }
  }
`.trim();

const shopifyMetafieldDefinitionCreate = async (
  credsPayload,
  ownerType,
  namespace,
  key,
  name,
  type,
  {
    apiVersion,
    access,
    description,
    pin,
    useAsCollectionCondition,
    validations,
    capabilities,
    returnSchema = defaultReturnSchema,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    ownerType,
    namespace,
    key,
    name,
    type,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyMutationDo(
    credsPayload,
    'metafieldDefinitionCreate',
    {
      mutationVariables: {
        definition: {
          type: 'MetafieldDefinitionInput!',
          value: {
            ownerType,
            namespace,
            key,
            name,
            type,
            ...(access && { access }),
            ...(description && { description }),
            ...(pin && { pin }),
            ...(useAsCollectionCondition && { useAsCollectionCondition }),
            ...(validations && { validations }),
            ...(capabilities && { capabilities }),
          },
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
  shopifyMetafieldDefinitionCreate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyMetafieldDefinitionCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "ownerType": "CUSTOMER",
    "namespace": "migrations",
    "key": "last_migration_data",
    "name": "Last Migration Data",
    "type": "json",
    "options": {
      "description": "Latest customer store migration details for on-site messaging",
      "access": {
        "storefront": "PUBLIC_READ"
      }
    }
  }'
*/
