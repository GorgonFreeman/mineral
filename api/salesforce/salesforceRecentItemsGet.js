// https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/resources_recent_items.htm

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { salesforceClient } = require('../salesforce/salesforce.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const salesforceRecentItemsGet = async (
  credsPayload,
  {
    limit,
    apiVersion,
    inspect = false,
    fetchClient = salesforceClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const params = {};
  if (limit !== undefined) {
    params.limit = limit;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'get',
      url: '/recent',
      params,
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
  salesforceRecentItemsGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/salesforceRecentItemsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "salesforce" },
    "options": { "limit": 10 }
  }'
*/
