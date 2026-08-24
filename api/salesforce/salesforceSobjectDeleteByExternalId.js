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

const salesforceSobjectDeleteByExternalIdSingle = async (
  credsPayload,
  sobjectType,
  externalIdField,
  externalId,
  {
    apiVersion,
    inspect = false,
    fetchClient = salesforceClient,
  } = {},
) => {

  return fetchClient.fetch({
    requestPayload: {
      method: 'delete',
      url: `/sobjects/${ sobjectType }/${ externalIdField }/${ encodeURIComponent(externalId) }`,
    },
    context: {
      credsPayload,
      apiVersion,
    },
    inspect,
  });
};

const salesforceSobjectDeleteByExternalId = async (
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
    salesforceSobjectDeleteByExternalIdSingle,
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
  salesforceSobjectDeleteByExternalId,
  salesforceSobjectDeleteByExternalIdSingle,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/salesforceSobjectDeleteByExternalId" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "salesforce" },
    "sobjectType": "Account",
    "externalIdField": "External_Id__c",
    "externalId": "ext-123"
  }'
*/
