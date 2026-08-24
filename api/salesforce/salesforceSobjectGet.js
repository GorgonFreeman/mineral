// https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/resources_sobject_retrieve.htm

const { ArgsWarden, actionSingleOrMultiple, valueProvided } = require('../utils');
const { credsValidator } = require('../validators');
const { salesforceClient } = require('../salesforce/salesforce.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['sobjectType', valueProvided],
  ['id'],
]);

const salesforceSobjectGetSingle = async (
  credsPayload,
  sobjectType,
  id,
  {
    fields,
    apiVersion,
    inspect = false,
    fetchClient = salesforceClient,
  } = {},
) => {

  const params = {};
  if (fields) {
    params.fields = Array.isArray(fields) ? fields.join(',') : fields;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'get',
      url: `/sobjects/${ sobjectType }/${ id }`,
      params,
    },
    context: {
      credsPayload,
      apiVersion,
    },
    inspect,
  });
};

const salesforceSobjectGet = async (
  credsPayload,
  sobjectType,
  id,
  {
    queueRunOptions,
    ...options
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    sobjectType,
    id,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return actionSingleOrMultiple(
    id,
    salesforceSobjectGetSingle,
    (idItem) => ({
      args: [credsPayload, sobjectType, idItem, options],
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
  salesforceSobjectGet,
  salesforceSobjectGetSingle,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/salesforceSobjectGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "salesforce" },
    "sobjectType": "Account",
    "id": "001xx000003DGb2AAG"
  }'
*/
