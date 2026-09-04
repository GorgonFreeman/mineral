// https://shopify.dev/docs/api/admin-graphql/latest/mutations/metafieldsset
// https://shopify.dev/docs/api/usage/bulk-operations/imports

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { shopifyBulkMutationDo } = require('./shopifyBulkMutationDo');

const metafieldsSetBulkMutation = `
  mutation call($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        id
        namespace
        key
        type
        value
      }
      userErrors {
        field
        message
      }
    }
  }
`.trim();

const metafieldsValidator = (metafields) => {
  return Array.isArray(metafields) && metafields.length > 0;
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['metafields', metafieldsValidator],
]);

const shopifyMetafieldsSetBulk = async (
  credsPayload,
  metafields,
  {
    ...bulkMutationOptions
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    metafields,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyBulkMutationDo(
    credsPayload,
    {
      mutation: metafieldsSetBulkMutation,
      input: {
        data: metafields.map((metafield) => ({
          metafields: [metafield],
        })),
      },
    },
    bulkMutationOptions,
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyMetafieldsSetBulk,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyMetafieldsSetBulk" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "metafields": [{
      "ownerId": "gid://shopify/Customer/2111702204488",
      "namespace": "facts",
      "key": "birth_date",
      "type": "date",
      "value": "1990-01-01"
    }]
  }'
*/
