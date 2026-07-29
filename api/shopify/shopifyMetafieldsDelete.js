// https://shopify.dev/docs/api/admin-graphql/latest/mutations/metafieldsDelete

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopifyMutationDo');

const metafieldsValidator = (metafields) => {
  return Array.isArray(metafields)
    && metafields.length > 0
    && metafields.every((metafield) => {
      return metafield?.ownerId && metafield?.namespace && metafield?.key;
    });
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['metafields', metafieldsValidator],
]);

const shopifyMetafieldsDelete = async (
  credsPayload,
  metafields,
  {
    apiVersion,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    metafields,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyMutationDo(
    credsPayload,
    'metafieldsDelete',
    {
      mutationVariables: {
        metafields: {
          type: '[MetafieldIdentifierInput!]!',
          value: metafields,
        },
      },
      returnSchema: `
        deletedMetafields {
          key
          namespace
          ownerId
        }
      `.trim(),
      apiVersion,
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyMetafieldsDelete,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyMetafieldsDelete" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "metafields": [{
      "ownerId": "gid://shopify/Customer/2111702204488",
      "namespace": "aug26_migration",
      "key": "loyalty_points"
    }]
  }'
*/
