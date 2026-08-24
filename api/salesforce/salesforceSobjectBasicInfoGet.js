// https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/resources_sobject_basic_info.htm

const { ArgsWarden, actionSingleOrMultiple, valueProvided } = require('../utils');
const { credsValidator } = require('../validators');
const { salesforceClient } = require('../salesforce/salesforce.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['sobjectType'],
]);

const salesforceSobjectBasicInfoGetSingle = async (
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
      url: `/sobjects/${ sobjectType }`,
    },
    context: {
      credsPayload,
      apiVersion,
    },
    inspect,
  });
};

const salesforceSobjectBasicInfoGet = async (
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
    salesforceSobjectBasicInfoGetSingle,
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
  salesforceSobjectBasicInfoGet,
  salesforceSobjectBasicInfoGetSingle,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/salesforceSobjectBasicInfoGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "salesforce" },
    "sobjectType": "Account"
  }'
*/
