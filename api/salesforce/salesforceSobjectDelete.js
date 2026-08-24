// https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/resources_sobject_retrieve.htm

const { ArgsWarden, actionSingleOrMultiple, valueProvided } = require('../utils');
const { credsValidator } = require('../validators');
const { salesforceClient } = require('../salesforce/salesforce.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['sobjectType', valueProvided],
  ['id'],
]);

const salesforceSobjectDeleteSingle = async (
  credsPayload,
  sobjectType,
  id,
  {
    apiVersion,
    inspect = false,
    fetchClient = salesforceClient,
  } = {},
) => {

  return fetchClient.fetch({
    requestPayload: {
      method: 'delete',
      url: `/sobjects/${ sobjectType }/${ id }`,
    },
    context: {
      credsPayload,
      apiVersion,
    },
    inspect,
  });
};

const salesforceSobjectDelete = async (
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
    salesforceSobjectDeleteSingle,
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
  salesforceSobjectDelete,
  salesforceSobjectDeleteSingle,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/salesforceSobjectDelete" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "salesforce" },
    "sobjectType": "Account",
    "id": "001xx000003DGb2AAG"
  }'
*/
