// https://shopify.dev/docs/api/admin-graphql/latest/mutations/metafieldsset
// https://shopify.dev/docs/api/admin-graphql/latest/mutations/metafieldsDelete
// https://shopify.dev/docs/api/usage/bulk-operations

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { shopifyBulkQueryDo } = require('./shopifyBulkQueryDo');
const { shopifyMetafieldsSetBulk } = require('./shopifyMetafieldsSetBulk');
const { shopifyBulkMutationDo } = require('./shopifyBulkMutationDo');

const namespaceDotKeyValidator = (value) => {
  return typeof value === 'string' && value.split('.').length === 2;
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['resourceType'],
  ['fromNamespaceDotKey', namespaceDotKeyValidator],
  ['toNamespaceDotKey', namespaceDotKeyValidator],
]);

const metafieldsDeleteBulkMutation = `
  mutation call($metafields: [MetafieldIdentifierInput!]!) {
    metafieldsDelete(metafields: $metafields) {
      deletedMetafields {
        key
        namespace
        ownerId
      }
      userErrors {
        field
        message
      }
    }
  }
`.trim();

const shopifyMetafieldValuesMove = async (
  credsPayload,
  resourceType,
  fromNamespaceDotKey,
  toNamespaceDotKey,
  {
    apiVersion,
    fromValuesDelete = false,
    ...bulkOptions
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload, 
    resourceType,
    fromNamespaceDotKey,
    toNamespaceDotKey,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const [fromNamespace, fromKey] = fromNamespaceDotKey.split('.');
  const [toNamespace, toKey] = toNamespaceDotKey.split('.');

  // Bulk query every resource of this type, requesting only the target metafield.
  // Connection name follows the same simple pluralisation used by shopifyGet.
  const resources = `${ resourceType }s`;
  const bulkQuery = `
    {
      ${ resources } {
        edges {
          node {
            id
            metafield(namespace: "${ fromNamespace }", key: "${ fromKey }") {
              namespace
              key
              type
              value
            }
          }
        }
      }
    }
  `.trim();

  const queryResponse = await shopifyBulkQueryDo(
    credsPayload,
    bulkQuery,
    {
      apiVersion,
      ...bulkOptions,
    },
  );

  if (!queryResponse.ok) {
    return queryResponse;
  }

  const resourcesWithMetafield = (queryResponse.data || []).filter(
    (resource) => resource?.metafield?.value != null,
  );

  if (!resourcesWithMetafield.length) {
    return {
      ok: true,
      data: {
        moved: [],
        deleted: [],
        message: 'Nothing to move',
      },
    };
  }

  const setInputs = resourcesWithMetafield.map((resource) => ({
    ownerId: resource.id,
    namespace: toNamespace,
    key: toKey,
    type: resource.metafield.type,
    value: resource.metafield.value,
  }));

  const deleteInputs = resourcesWithMetafield.map((resource) => ({
    ownerId: resource.id,
    namespace: fromNamespace,
    key: fromKey,
  }));

  // Bulk set under the new namespace/key
  const setResponse = await shopifyMetafieldsSetBulk(
    credsPayload,
    setInputs,
    {
      apiVersion,
      ...bulkOptions,
    },
  );

  if (!fromValuesDelete) {
    return setResponse;
  }

  const {
    ok: setOk,
    data: setData,
  } = setResponse;

  if (!setOk) {
    return setResponse;
  }

  // Abort if any individual set line reported userErrors (or top-level errors)
  const failedSets = setData.filter((line) => {
    const userErrors = line?.data?.metafieldsSet?.userErrors;
    const topLevelErrors = line?.errors;
    return (Array.isArray(userErrors) && userErrors.length > 0)
      || (Array.isArray(topLevelErrors) && topLevelErrors.length > 0);
  });

  if (failedSets.length) {
    return {
      ok: false,
      error: {
        code: 'METAFIELD_SET_PARTIAL_FAILURE',
        message: `${ failedSets.length } of ${ setResults.length } metafield set(s) failed; aborting delete of originals`,
        details: failedSets,
      },
      data: {
        set: setResults,
      },
      meta: {
        queryBulkOperation: queryResponse.meta?.bulkOperation,
        setBulkOperation: setResponse.meta?.bulkOperation,
      },
    };
  }

  // Bulk delete the originals (only after every set succeeded)
  const deleteResponse = await shopifyBulkMutationDo(
    credsPayload,
    {
      mutation: metafieldsDeleteBulkMutation,
      input: {
        data: deleteInputs.map((identifier) => ({
          metafields: [identifier],
        })),
      },
    },
    {
      apiVersion,
      ...bulkOptions,
    },
  );
  
  // TODO: Revise final response structure
  return {
    ok: deleteResponse.ok,
    data: {
      set: setResponse.data,
      deleted: deleteResponse.data,
    },
    ...(deleteResponse.error && { error: deleteResponse.error }),
    meta: {
      queryBulkOperation: queryResponse.meta?.bulkOperation,
      setBulkOperation: setResponse.meta?.bulkOperation,
      deleteBulkOperation: deleteResponse.meta?.bulkOperation,
    },
  };
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyMetafieldValuesMove,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyMetafieldValuesMove" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "resourceType": "tree",
    "fromNamespaceDotKey": "branches.leaves",
    "toNamespaceDotKey": "ground.leaves"
  }'
*/
