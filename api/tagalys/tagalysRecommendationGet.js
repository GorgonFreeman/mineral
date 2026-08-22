// https://tagalys.notion.site/Storefront-API-v2-20eacdd38c2080d58d3fd0cf6f24e435

const { credsValidator } = require('../validators');
const { ArgsWarden, actionSingleOrMultiple, ensureArray, logDeep } = require('../utils');
const { MAX_RECOMMENDATION_PRODUCT_IDS } = require('../tagalys/tagalys.constants');
const {
  tagalysClient,
  requestContextParams,
} = require('../tagalys/tagalys.utils');

// System-defined ids: bought_also_bought, viewed_also_viewed, atc_also_atc,
// recently_viewed, personalized. Custom recommendations use a dashboard slug
// (e.g. 8d72jc02jd719ddc6hw0).
const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['recommendationId'],
]);

const tagalysRecommendationGetSingle = async (
  credsPayload,
  recommendationId,
  {
    productIds, // up to 3, for product-contextual recommendations
    count,

    // personalized / recently_viewed: either deviceId or userId is required
    deviceId,
    userId,

    fallbackRecommendationId, // personalized only
    visitId, // recently_viewed only

    country,
    language,
    segmentTag,
  } = {},
) => {
  const response = await tagalysClient.fetch({
    context: {
      credsPayload,
    },
    requestPayload: {
      url: `/v2/recommendations/${ recommendationId }`,
      method: 'get',
      query: {
        ...(productIds ? { product_ids: ensureArray(productIds).slice(0, MAX_RECOMMENDATION_PRODUCT_IDS) } : {}),
        ...(count ? { count } : {}),
        ...(deviceId ? { device_id: deviceId } : {}),
        ...(userId ? { user_id: userId } : {}),
        ...(fallbackRecommendationId ? { fallback_recommendation_id: fallbackRecommendationId } : {}),
        ...(visitId ? { visit_id: visitId } : {}),
        ...requestContextParams({ country, language, segmentTag }),
      },
    },
  });

  const { ok, error } = response;
  if (!ok) {
    logDeep({ error });
  }

  return response;
};

const tagalysRecommendationGet = async (
  credsPayload,
  recommendationId,
  {
    queueRunOptions,
    ...options
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    recommendationId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return actionSingleOrMultiple(
    recommendationId,
    tagalysRecommendationGetSingle,
    (recommendationIdItem) => ({
      args: [credsPayload, recommendationIdItem, options],
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
  tagalysRecommendationGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/tagalysRecommendationGet" \
-d '{
  "credsPayload": { "credsPath": "tagalys.store" },
  "recommendationId": "bought_also_bought",
  "options": { "productIds": ["1234567890"], "count": 10 }
}'
*/
