// https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/resources_sobject_describe.htm

const { ArgsWarden, actionSingleOrMultiple, valueProvided } = require('../utils');
const { credsValidator } = require('../validators');
const { salesforceClient } = require('../salesforce/salesforce.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['sobjectType', valueProvided],
]);

const salesforceSobjectDescribeSingle = async (
  credsPayload,
  sobjectType,
  {
    apiVersion,
    inspect = false,
    fetchClient = salesforceClient,
  } = {},
) => {

  return fetchClient.fetch({
    requestPayload: {
      method: 'get',
      url: `/sobjects/${ sobjectType }/describe`,
    },
    context: {
      credsPayload,
      apiVersion,
    },
    inspect,
  });
};

const salesforceSobjectDescribe = async (
  credsPayload,
  sobjectType,
  {
    queueRunOptions,
    ...options
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    sobjectType,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return actionSingleOrMultiple(
    sobjectType,
    salesforceSobjectDescribeSingle,
    (sobjectTypeItem) => ({
      args: [credsPayload, sobjectTypeItem, options],
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
  salesforceSobjectDescribe,
  salesforceSobjectDescribeSingle,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/salesforceSobjectDescribe" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "salesforce" },
    "sobjectType": "Account"
  }'
*/
