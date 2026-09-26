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

const ownerIdsFromSetLines = (setData = []) => {
  return setData
    .map((line) => line?.data?.metafieldsSet?.metafields?.[0]?.ownerId)
    .filter(Boolean);
};

const shopifyMetafieldValuesMove = async (
  credsPayload,
  resourceType,
  fromNamespaceDotKey,
  toNamespaceDotKey,
  {
    apiVersion,
    fromValuesDelete = false,
    // Persist/resume helpers for long-running bulk stages: 'query' | 'set' | 'delete'
    getOperationId,
    setOperationId,
    deleteOperationId,
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

  const existingQueryId = getOperationId ? await getOperationId('query') : null;
  const existingSetId = getOperationId ? await getOperationId('set') : null;
  const existingDeleteId = getOperationId ? await getOperationId('delete') : null;

  let queryResponse;
  let setResponse;
  let deleteResponse;
  let resourcesWithMetafield;

  // --- Resume delete (latest stage) ---
  if (existingDeleteId) {
    deleteResponse = await shopifyBulkMutationDo(
      credsPayload,
      { bulkOperationId: existingDeleteId },
      {
        apiVersion,
        ...bulkOptions,
      },
    );

    if (deleteResponse.ok && deleteOperationId) {
      await deleteOperationId('delete');
    }

    return {
      ok: deleteResponse.ok,
      data: {
        set: null,
        deleted: deleteResponse.data,
      },
      ...(deleteResponse.error && { error: deleteResponse.error }),
      meta: {
        resumed: 'delete',
        deleteBulkOperation: deleteResponse.meta?.bulkOperation,
      },
    };
  }

  // --- Resume set (skip query; rebuild delete inputs from set results or re-query) ---
  if (existingSetId) {
    setResponse = await shopifyBulkMutationDo(
      credsPayload,
      { bulkOperationId: existingSetId },
      {
        apiVersion,
        ...bulkOptions,
      },
    );

    if (!setResponse.ok) {
      return setResponse;
    }

    if (deleteOperationId) {
      await deleteOperationId('set');
    }

    if (!fromValuesDelete) {
      return setResponse;
    }

    const {
      ok: setOk,
      data: setData,
    } = setResponse;

    const failedSets = (setData || []).filter((line) => {
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
          message: `${ failedSets.length } of ${ setData.length } metafield set(s) failed; aborting delete of originals`,
          details: failedSets,
        },
        meta: {
          resumed: 'set',
          setBulkOperation: setResponse.meta?.bulkOperation,
        },
      };
    }

    let deleteInputs = ownerIdsFromSetLines(setData).map((ownerId) => ({
      ownerId,
      namespace: fromNamespace,
      key: fromKey,
    }));

    // Older set mutations may not return ownerId — re-query remaining from-values
    if (!deleteInputs.length) {
      queryResponse = await shopifyBulkQueryDo(
        credsPayload,
        bulkQuery,
        {
          apiVersion,
          onBulkOperationId: setOperationId
            ? (id) => setOperationId('query', id)
            : undefined,
          ...bulkOptions,
        },
      );

      if (!queryResponse.ok) {
        return queryResponse;
      }

      if (deleteOperationId) {
        await deleteOperationId('query');
      }

      deleteInputs = (queryResponse.data || [])
        .filter((resource) => resource?.metafield?.value != null)
        .map((resource) => ({
          ownerId: resource.id,
          namespace: fromNamespace,
          key: fromKey,
        }));
    }

    if (!deleteInputs.length) {
      return {
        ok: true,
        data: {
          set: setData,
          deleted: [],
          message: 'Nothing to delete after set',
        },
        meta: {
          resumed: 'set',
          setBulkOperation: setResponse.meta?.bulkOperation,
          queryBulkOperation: queryResponse?.meta?.bulkOperation,
        },
      };
    }

    deleteResponse = await shopifyBulkMutationDo(
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
        onBulkOperationId: setOperationId
          ? (id) => setOperationId('delete', id)
          : undefined,
        ...bulkOptions,
      },
    );

    if (deleteResponse.ok && deleteOperationId) {
      await deleteOperationId('delete');
    }

    return {
      ok: deleteResponse.ok,
      data: {
        set: setData,
        deleted: deleteResponse.data,
      },
      ...(deleteResponse.error && { error: deleteResponse.error }),
      meta: {
        resumed: 'set',
        queryBulkOperation: queryResponse?.meta?.bulkOperation,
        setBulkOperation: setResponse.meta?.bulkOperation,
        deleteBulkOperation: deleteResponse.meta?.bulkOperation,
      },
    };
  }

  // --- Query (fresh or resume) ---
  queryResponse = await shopifyBulkQueryDo(
    credsPayload,
    bulkQuery,
    {
      apiVersion,
      ...(existingQueryId ? { bulkOperationId: existingQueryId } : {}),
      onBulkOperationId: setOperationId
        ? (id) => setOperationId('query', id)
        : undefined,
      ...bulkOptions,
    },
  );

  if (!queryResponse.ok) {
    return queryResponse;
  }

  if (deleteOperationId) {
    await deleteOperationId('query');
  }

  resourcesWithMetafield = (queryResponse.data || []).filter(
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
      meta: {
        queryBulkOperation: queryResponse.meta?.bulkOperation,
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
  setResponse = await shopifyMetafieldsSetBulk(
    credsPayload,
    setInputs,
    {
      apiVersion,
      onBulkOperationId: setOperationId
        ? (id) => setOperationId('set', id)
        : undefined,
      ...bulkOptions,
    },
  );

  if (!fromValuesDelete) {
    if (setResponse.ok && deleteOperationId) {
      await deleteOperationId('set');
    }
    return setResponse;
  }

  const {
    ok: setOk,
    data: setData,
  } = setResponse;

  if (!setOk) {
    return setResponse;
  }

  if (deleteOperationId) {
    await deleteOperationId('set');
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
        message: `${ failedSets.length } of ${ setData.length } metafield set(s) failed; aborting delete of originals`,
        details: failedSets,
      },
      meta: {
        queryBulkOperation: queryResponse.meta?.bulkOperation,
        setBulkOperation: setResponse.meta?.bulkOperation,
      },
    };
  }

  // Bulk delete the originals (only after every set succeeded)
  deleteResponse = await shopifyBulkMutationDo(
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
      onBulkOperationId: setOperationId
        ? (id) => setOperationId('delete', id)
        : undefined,
      ...bulkOptions,
    },
  );

  if (deleteResponse.ok && deleteOperationId) {
    await deleteOperationId('delete');
  }
  
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
