// https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/resources_query_more.htm

const { ArgsWarden, valueProvided } = require('../utils');
const { credsValidator } = require('../validators');
const { salesforceClient } = require('../salesforce/salesforce.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['nextRecordsUrl'],
]);

/**
 * nextRecordsUrl from a prior query response is typically
 * /services/data/vXX.X/query/{locator}. The client prefixes
 * {instance}/services/data/v{version}, so strip down to /query/...
 */
const pathFromNextRecordsUrl = (nextRecordsUrl) => {
  const match = String(nextRecordsUrl).match(/\/services\/data\/v[\d.]+(\/.*)$/i);
  if (match) {
    return match[1];
  }
  if (String(nextRecordsUrl).startsWith('/query')) {
    return nextRecordsUrl;
  }
  return `/query/${ nextRecordsUrl }`;
};

const salesforceQueryMore = async (
  credsPayload,
  nextRecordsUrl,
  {
    apiVersion,
    inspect = false,
    fetchClient = salesforceClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    nextRecordsUrl,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'get',
      url: pathFromNextRecordsUrl(nextRecordsUrl),
    },
    context: {
      credsPayload,
      apiVersion,
    },
    inspect,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  salesforceQueryMore,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/salesforceQueryMore" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "salesforce" },
    "nextRecordsUrl": "/services/data/v62.0/query/01gxx000000xxxx-2000"
  }'
*/
