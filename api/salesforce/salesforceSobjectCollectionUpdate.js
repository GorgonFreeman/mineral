// https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/resources_composite_sobjects_collections_update.htm

const { ArgsWarden, valueProvided } = require('../utils');
const { credsValidator } = require('../validators');
const { salesforceClient } = require('../salesforce/salesforce.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['records'],
]);

const salesforceSobjectCollectionUpdate = async (
  credsPayload,
  records,
  {
    allOrNone,
    apiVersion,
    inspect = false,
    fetchClient = salesforceClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    records,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const body = {
    records,
  };
  if (allOrNone !== undefined) {
    body.allOrNone = allOrNone;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'patch',
      url: '/composite/sobjects',
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
  salesforceSobjectCollectionUpdate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/salesforceSobjectCollectionUpdate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "salesforce" },
    "records": [
      {
        "attributes": { "type": "Account" },
        "Id": "001xx000003DGb2AAG",
        "Name": "Updated via collection"
      }
    ]
  }'
*/
