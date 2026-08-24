// https://docs.fastsimon.com/api/api-doc.html#tag/Serving-API/operation/fulltextProducts

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { fastsimonClient, ensureCdnCacheKey } = require('../fastsimon/fastsimon.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['query'],
]);

const fastsimonSearch = async (
  credsPayload,
  query,
  {
    cdnCacheKey,
    facetsRequired,
    sortBy,
    narrow,
    pageNum,
    fetchClient = fastsimonClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    query,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  let resolvedCdnCacheKey = cdnCacheKey;
  if (!resolvedCdnCacheKey) {
    const loadRes = await ensureCdnCacheKey(credsPayload, { fetchClient });
    if (!loadRes.ok) {
      return loadRes;
    }
    resolvedCdnCacheKey = loadRes.data.cdn_cache_key;
  }

  const response = await fetchClient.fetch({
    requestPayload: {
      method: 'get',
      url: '/full_text_search',
      query: {
        q: query,
        cdn_cache_key: resolvedCdnCacheKey,
        ...(facetsRequired !== undefined ? { facets_required: facetsRequired } : {}),
        ...(sortBy ? { sort_by: sortBy } : {}),
        ...(narrow !== undefined ? { narrow } : {}),
        ...(pageNum !== undefined ? { page_num: pageNum } : {}),
      },
    },
    context: {
      credsPayload,
    },
  });

  return response;
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  fastsimonSearch,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/fastsimonSearch" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "fastsimon.store" },
    "query": "dress",
    "options": {
      "facetsRequired": 1,
      "pageNum": 1,
      "sortBy": "relevency"
    }
  }'
*/
