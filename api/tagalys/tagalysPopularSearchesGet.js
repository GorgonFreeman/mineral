// https://tagalys.notion.site/Storefront-API-v2-20eacdd38c2080d58d3fd0cf6f24e435

const { credsValidator } = require('../validators');
const { ArgsWarden, logDeep } = require('../utils');
const { tagalysClient } = require('../tagalys/tagalys.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

// Returns at most 10 queries. When the store is configured for country-based
// availability, `country` filters the response (see the docs).
const tagalysPopularSearchesGet = async (
  credsPayload,
  {
    country,
  } = {},
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const response = await tagalysClient.fetch({
    context: {
      credsPayload,
    },
    requestPayload: {
      url: '/v2/popular_searches',
      method: 'get',
      query: {
        ...(country ? { country } : {}),
      },
    },
  });

  const { ok, data, error } = response;
  if (!ok) {
    logDeep({ error });
    return { ok: false, error };
  }

  return { ok: true, data };
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  tagalysPopularSearchesGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/tagalysPopularSearchesGet" \
-d '{ "credsPayload": { "credsPath": "tagalys.au" } }'
*/
