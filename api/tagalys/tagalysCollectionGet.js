// https://tagalys.notion.site/Storefront-API-v2-20eacdd38c2080d58d3fd0cf6f24e435

const { credsValidator } = require('../validators');
const { ArgsWarden, actionSingleOrMultiple, logDeep } = require('../utils');
const { DEFAULT_INCLUDE } = require('../tagalys/tagalys.constants');
const { tagalysClient } = require('../tagalys/tagalys.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['collectionId'],
]);

const tagalysCollectionGetSingle = async (
  credsPayload,
  collectionId,
  {
    include = DEFAULT_INCLUDE, // e.g. ['products', 'filters', 'sort_options', 'total_count']
    filter, // e.g. { color: ['red'], price: { selected_min: 100, selected_max: 200 } }
    scope, // e.g. { gender: ['female'] }
    sort, // e.g. 'price-asc'
    page,
    perPage,
    bannerPositions, // { source: 'dashboard' | 'custom' | 'none', fixed: [4, 6], repeating: { every: 16, at: [5] } }
    country,
    language,
    segmentTag,
  } = {},
) => {
  const response = await tagalysClient.fetch({
    context: {
      credsPayload,
      country,
      language,
      segmentTag,
    },
    requestPayload: {
      url: `/v2/collections/${ collectionId }`,
      method: 'get',
      query: {
        include,
        ...(filter ? { filter } : {}),
        ...(scope ? { scope } : {}),
        ...(sort ? { sort } : {}),
        ...(page ? { page } : {}),
        ...(perPage ? { per_page: perPage } : {}),
        ...(bannerPositions ? { banner_positions: bannerPositions } : {}),
      },
    },
  });

  const { ok, error } = response;
  if (!ok) {
    logDeep({ error });
  }

  return response;
};

const tagalysCollectionGet = async (
  credsPayload,
  collectionId,
  {
    queueRunOptions,
    ...options
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    collectionId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return actionSingleOrMultiple(
    collectionId,
    tagalysCollectionGetSingle,
    (collectionIdItem) => ({
      args: [credsPayload, collectionIdItem, options],
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  tagalysCollectionGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/tagalysCollectionGet" \
-d '{ "credsPayload": { "credsPath": "tagalys.store" }, "collectionId": "123456789" }'
*/
