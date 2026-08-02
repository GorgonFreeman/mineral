// https://shopify.dev/docs/api/admin-graphql/latest/queries/metafieldDefinition

const { credsValidator } = require('../validators');
const { ArgsWarden, objHasAny } = require('../utils');
const { shopifyClient } = require('./shopify.utils');

const metafieldDefinitionIdentifierValidator = (metafieldDefinitionIdentifier) => {
  return objHasAny(metafieldDefinitionIdentifier, [
    'ownerType',
    'namespace',
    'key',
  ]);
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['metafieldDefinitionIdentifier', metafieldDefinitionIdentifierValidator],
]);

const defaultAttrs = `
  name
  namespace
  key
  description
  ownerType
  pinnedPosition
  type {
    name
  }
  validations {
    name
    value
  }
  capabilities {
    adminFilterable {
      enabled
    }
    smartCollectionCondition {
      enabled
    }
    uniqueValues {
      enabled
    }
  }
`.trim();

const shopifyMetafieldDefinitionGet = async (
  credsPayload,
  metafieldDefinitionIdentifier,
  {
    apiVersion,
    attrs = defaultAttrs,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    metafieldDefinitionIdentifier,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyClient.fetch({
    requestPayload: {
      method: 'post',
      body: {
        query: `
          query GetMetafieldDefinition($identifier: MetafieldDefinitionIdentifierInput!) {
            metafieldDefinition(identifier: $identifier) {
              ${ attrs }
            }
          }
        `,
        variables: {
          identifier: metafieldDefinitionIdentifier,
        },
      },
    },
    context: {
      credsPayload,
      apiVersion,
      resultPath: 'data.metafieldDefinition',
    },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyMetafieldDefinitionGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyMetafieldDefinitionGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "metafieldDefinitionIdentifier": {
      "ownerType": "PRODUCT",
      "namespace": "custom",
      "key": "outfit_builder_image"
    }
  }'
*/
