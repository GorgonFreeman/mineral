// https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/resources_composite_composite.htm

const { ArgsWarden, valueProvided } = require('../utils');
const { credsValidator } = require('../validators');
const { salesforceClient } = require('../salesforce/salesforce.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['compositeRequest'],
]);

const salesforceComposite = async (
  credsPayload,
  compositeRequest,
  {
    allOrNone,
    collateSubrequests,
    apiVersion,
    inspect = false,
    fetchClient = salesforceClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    compositeRequest,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const body = {
    compositeRequest,
  };
  if (allOrNone !== undefined) {
    body.allOrNone = allOrNone;
  }
  if (collateSubrequests !== undefined) {
    body.collateSubrequests = collateSubrequests;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'post',
      url: '/composite',
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
  salesforceComposite,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/salesforceComposite" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "salesforce" },
    "compositeRequest": [
      {
        "method": "GET",
        "url": "/services/data/v62.0/sobjects/Account/001xx000003DGb2AAG",
        "referenceId": "refAccount"
      }
    ],
    "options": { "allOrNone": true }
  }'
*/
