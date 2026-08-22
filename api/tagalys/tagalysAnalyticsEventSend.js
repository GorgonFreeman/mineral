// https://tagalys.notion.site/Storefront-API-v2-20eacdd38c2080d58d3fd0cf6f24e435

const { credsValidator } = require('../validators');
const { ArgsWarden, actionSingleOrMultiple, everyIfArray, valueProvided, logDeep } = require('../utils');
const { tagalysClient } = require('../tagalys/tagalys.utils');

// Supported `type` values and their `payload` shape:
//   product_viewed            { productId }
//   product_added_to_cart     { productId, quantity }
//   checkout_completed        { orderId, lineItems: [{ productId, quantity }] }
//   search_results_viewed     { query, productIds, page, totalCount, queryHandling?, sortedBy?, filteredBy? }
//   collection_viewed         { collectionId, productIds?, page?, totalCount?, sortedBy?, filteredBy? }
//   recommendations_viewed    { id, recommendedProductIds, sourceProductIds? (required when `id` is contextual to a product) }
const eventPayloadValidator = (eventPayload) => {
  return valueProvided(eventPayload?.type)
    && valueProvided(eventPayload?.payload)
    && valueProvided(eventPayload?.context?.deviceId)
    && valueProvided(eventPayload?.context?.visitId);
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['eventPayload', (eventPayload) => everyIfArray(eventPayloadValidator, eventPayload)],
]);

const tagalysAnalyticsEventSendSingle = async (
  credsPayload,
  eventPayload,
) => {
  const { type, payload, context } = eventPayload;
  const {
    deviceId,
    visitId,
    userId,
    country,
    language,
    segmentTag,
    apiClientName,
    apiClientVersion,
  } = context;

  const response = await tagalysClient.fetch({
    context: {
      credsPayload,
    },
    requestPayload: {
      url: '/v2/analytics/events',
      method: 'post',
      body: {
        type,
        payload,
        context: {
          device_id: deviceId,
          visit_id: visitId,
          ...(userId ? { user_id: userId } : {}),
          ...(country ? { country } : {}),
          ...(language ? { language } : {}),
          ...(segmentTag ? { segment_tag: segmentTag } : {}),
          ...((apiClientName || apiClientVersion) ? {
            api_client: {
              ...(apiClientName ? { name: apiClientName } : {}),
              ...(apiClientVersion ? { version: apiClientVersion } : {}),
            },
          } : {}),
        },
      },
    },
  });

  const { ok, error } = response;
  if (!ok) {
    logDeep({ error });
  }

  return response;
};

const tagalysAnalyticsEventSend = async (
  credsPayload,
  eventPayload,
  {
    queueRunOptions,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    eventPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return actionSingleOrMultiple(
    eventPayload,
    tagalysAnalyticsEventSendSingle,
    (eventPayloadItem) => ({
      args: [credsPayload, eventPayloadItem],
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
  tagalysAnalyticsEventSend,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/tagalysAnalyticsEventSend" \
-d '{
  "credsPayload": { "credsPath": "tagalys.store" },
  "eventPayload": {
    "type": "product_viewed",
    "payload": { "productId": "7286848028804" },
    "context": { "deviceId": "d123", "visitId": "v123" }
  }
}'
*/
