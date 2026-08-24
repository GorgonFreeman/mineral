// https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/resources_composite_batch.htm

const { ArgsWarden, valueProvided } = require('../utils');
const { credsValidator } = require('../validators');
const { salesforceClient } = require('../salesforce/salesforce.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['batchRequests', valueProvided],
]);

const salesforceCompositeBatch = async (
  credsPayload,
  batchRequests,
  {
    haltOnError,
    apiVersion,
    inspect = false,
    fetchClient = salesforceClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    batchRequests,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const body = {
    batchRequests,
  };
  if (haltOnError !== undefined) {
    body.haltOnError = haltOnError;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'post',
      url: '/composite/batch',
      body,
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
  salesforceCompositeBatch,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/salesforceCompositeBatch" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "salesforce" },
    "batchRequests": [
      {
        "method": "GET",
        "url": "v62.0/sobjects/Account/describe"
      }
    ]
  }'
*/
