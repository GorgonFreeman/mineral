// https://shopify.dev/docs/api/admin-graphql/latest/mutations/metafieldsDelete
// https://shopify.dev/docs/api/usage/bulk-operations

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { shopifyBulkQueryDo } = require('./shopifyBulkQueryDo');
const { shopifyBulkMutationDo } = require('./shopifyBulkMutationDo');

const namespaceDotKeyValidator = (value) => {
  return typeof value === 'string' && value.split('.').length === 2;
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['resourceType'],
  ['namespaceDotKey', namespaceDotKeyValidator],
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

const shopifyMetafieldValuesDelete = async (
  credsPayload,
  resourceType,
  namespaceDotKey,
  {
    apiVersion,
    waitForResult = true,
    ...bulkOptions
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    resourceType,
    namespaceDotKey,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const [namespace, key] = namespaceDotKey.split('.');

  const resources = `${ resourceType }s`;
  const bulkQuery = `
    {
      ${ resources } {
        edges {
          node {
            id
            metafield(namespace: "${ namespace }", key: "${ key }") {
              namespace
              key
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
      waitForResult,
      ...bulkOptions,
    },
  );

  if (!queryResponse.ok) {
    return queryResponse;
  }

  const resourcesWithMetafield = (queryResponse.data || []).filter(
    (resource) => resource?.metafield != null,
  );

  if (!resourcesWithMetafield.length) {
    return {
      ok: true,
      data: {
        deleted: [],
        message: 'Nothing to delete',
      },
      meta: {
        queryBulkOperation: queryResponse.meta?.bulkOperation,
      },
    };
  }

  const deleteInputs = resourcesWithMetafield.map((resource) => ({
    ownerId: resource.id,
    namespace,
    key,
  }));

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
      waitForResult,
      ...bulkOptions,
    },
  );

  return {
    ok: deleteResponse.ok,
    data: {
      deleted: deleteResponse.data,
    },
    ...(deleteResponse.error && { error: deleteResponse.error }),
    meta: {
      queryBulkOperation: queryResponse.meta?.bulkOperation,
      deleteBulkOperation: deleteResponse.meta?.bulkOperation,
    },
  };
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyMetafieldValuesDelete,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyMetafieldValuesDelete" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.staging" },
    "resourceType": "product",
    "namespaceDotKey": "branches.leaves"
  }'
*/
