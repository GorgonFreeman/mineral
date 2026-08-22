// https://tagalys.notion.site/Storefront-API-v2-20eacdd38c2080d58d3fd0cf6f24e435

const { credsValidator } = require('../validators');
const { ArgsWarden, logDeep } = require('../utils');
const { DEFAULT_INCLUDE } = require('../tagalys/tagalys.constants');
const { tagalysClient } = require('../tagalys/tagalys.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['query'],
]);

const tagalysSearch = async (
  credsPayload,
  query,
  {
    include = DEFAULT_INCLUDE, // e.g. ['products', 'filters', 'sort_options', 'total_count']
    filter, // e.g. { color: ['red'], price: { selected_min: 100, selected_max: 200 } }
    scope, // e.g. { gender: ['female'] }
    sort, // e.g. 'price-asc'
    page,
    perPage,
    country,
    language,
    segmentTag,
  } = {},
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    query,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  // A search can be both redirected and spelling-corrected in the same
  // response -- redirected/redirectUrl and data (query_handling,
  // original_query, etc.) both land on the response, see
  // tagalys.utils.js#useRedirectResponse.
  const response = await tagalysClient.fetch({
    context: {
      credsPayload,
      country,
      language,
      segmentTag,
    },
    requestPayload: {
      url: '/v2/search',
      method: 'get',
      query: {
        query,
        include,
        ...(filter ? { filter } : {}),
        ...(scope ? { scope } : {}),
        ...(sort ? { sort } : {}),
        ...(page ? { page } : {}),
        ...(perPage ? { per_page: perPage } : {}),
      },
    },
  });

  const { ok, error } = response;
  if (!ok) {
    logDeep({ error });
  }

  return response;
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  tagalysSearch,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/tagalysSearch" \
-d '{ "credsPayload": { "credsPath": "tagalys.store" }, "query": "gold" }'
*/
