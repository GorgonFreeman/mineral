// https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/resources_sobject_upsert.htm

const { ArgsWarden, actionSingleOrMultiple, valueProvided } = require('../utils');
const { credsValidator } = require('../validators');
const { salesforceClient } = require('../salesforce/salesforce.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['sobjectType'],
  ['externalIdField'],
  ['externalId'],
]);

const salesforceSobjectGetByExternalIdSingle = async (
  credsPayload,
  sobjectType,
  externalIdField,
  externalId,
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
      url: `/sobjects/${ sobjectType }/${ externalIdField }/${ encodeURIComponent(externalId) }`,
      params,
    },
    context: {
      credsPayload,
      apiVersion,
    },
    inspect,
  });
};

const salesforceSobjectGetByExternalId = async (
  credsPayload,
  sobjectType,
  externalIdField,
  externalId,
  {
    queueRunOptions,
    ...options
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    sobjectType,
    externalIdField,
    externalId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return actionSingleOrMultiple(
    externalId,
    salesforceSobjectGetByExternalIdSingle,
    (externalIdItem) => ({
      args: [credsPayload, sobjectType, externalIdField, externalIdItem, options],
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
  salesforceSobjectGetByExternalId,
  salesforceSobjectGetByExternalIdSingle,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/salesforceSobjectGetByExternalId" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "salesforce" },
    "sobjectType": "Account",
    "externalIdField": "External_Id__c",
    "externalId": "ext-123"
  }'
*/
