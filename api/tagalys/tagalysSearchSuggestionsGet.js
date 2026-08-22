// https://tagalys.notion.site/Storefront-API-v2-20eacdd38c2080d58d3fd0cf6f24e435

const { credsValidator } = require('../validators');
const { ArgsWarden, logDeep, valueProvided } = require('../utils');
const { tagalysClient } = require('../tagalys/tagalys.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['query'],
  ['sections', (sections) => valueProvided(sections) && Object.keys(sections).length > 0],
]);

// `sections` is an object keyed by section_id, e.g.:
// {
//   products: { count: 6, include: ['items', 'total_count'], scope: { gender: ['female'] } },
//   collections: { count: 4 },
//   searches: { count: 4 },
// }
// section_ids and their available options are configured per account by Tagalys.
const tagalysSearchSuggestionsGet = async (
  credsPayload,
  query,
  sections,
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    query,
    sections,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  // redirected/redirectUrl land on the response via tagalys.utils.js#useRedirectResponse
  const response = await tagalysClient.fetch({
    context: {
      credsPayload,
    },
    requestPayload: {
      url: '/v2/search_suggestions',
      method: 'get',
      query: {
        query,
        sections,
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
  tagalysSearchSuggestionsGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/tagalysSearchSuggestionsGet" \
-d '{
  "credsPayload": { "credsPath": "tagalys.store" },
  "query": "shi",
  "sections": {
    "products": { "count": 6 },
    "collections": { "count": 4 }
  }
}'
*/
