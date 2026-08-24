// https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/resources_sobject_retrieve.htm

const { ArgsWarden, actionSingleOrMultiple, valueProvided } = require('../utils');
const { credsValidator } = require('../validators');
const { salesforceClient } = require('../salesforce/salesforce.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['sobjectType'],
  ['id'],
  ['record'],
]);

const salesforceSobjectUpdateSingle = async (
  credsPayload,
  sobjectType,
  id,
  record,
  {
    apiVersion,
    inspect = false,
    fetchClient = salesforceClient,
  } = {},
) => {

  return fetchClient.fetch({
    requestPayload: {
      method: 'patch',
      url: `/sobjects/${ sobjectType }/${ id }`,
      body: record,
    },
    context: {
      credsPayload,
      apiVersion,
    },
    inspect,
  });
};

const salesforceSobjectUpdate = async (
  credsPayload,
  sobjectType,
  id,
  record,
  {
    queueRunOptions,
    ...options
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    sobjectType,
    id,
    record,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return actionSingleOrMultiple(
    id,
    salesforceSobjectUpdateSingle,
    (idItem) => ({
      args: [credsPayload, sobjectType, idItem, record, options],
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
  salesforceSobjectUpdate,
  salesforceSobjectUpdateSingle,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/salesforceSobjectUpdate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "salesforce" },
    "sobjectType": "Account",
    "id": "001xx000003DGb2AAG",
    "record": {
      "Name": "Updated Account"
    }
  }'
*/
