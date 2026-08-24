// https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/resources_sobject_layouts.htm

const { ArgsWarden, valueProvided } = require('../utils');
const { credsValidator } = require('../validators');
const { salesforceClient } = require('../salesforce/salesforce.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['sobjectType', valueProvided],
]);

const salesforceSobjectDescribeLayouts = async (
  credsPayload,
  sobjectType,
  {
    recordTypeId,
    apiVersion,
    inspect = false,
    fetchClient = salesforceClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    sobjectType,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const url = recordTypeId
    ? `/sobjects/${ sobjectType }/describe/layouts/${ recordTypeId }`
    : `/sobjects/${ sobjectType }/describe/layouts`;

  return fetchClient.fetch({
    requestPayload: {
      method: 'get',
      url,
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
  salesforceSobjectDescribeLayouts,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/salesforceSobjectDescribeLayouts" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "salesforce" },
    "sobjectType": "Account"
  }'
*/
