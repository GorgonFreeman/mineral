// https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/resources_sobject_upsert.htm

const { ArgsWarden, valueProvided } = require('../utils');
const { credsValidator } = require('../validators');
const { salesforceClient } = require('../salesforce/salesforce.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['sobjectType'],
  ['externalIdField'],
  ['externalId'],
  ['record'],
]);

const salesforceSobjectUpsert = async (
  credsPayload,
  sobjectType,
  externalIdField,
  externalId,
  record,
  {
    apiVersion,
    inspect = false,
    fetchClient = salesforceClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    sobjectType,
    externalIdField,
    externalId,
    record,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'patch',
      url: `/sobjects/${ sobjectType }/${ externalIdField }/${ encodeURIComponent(externalId) }`,
      body: record,
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
  salesforceSobjectUpsert,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/salesforceSobjectUpsert" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "salesforce" },
    "sobjectType": "Account",
    "externalIdField": "External_Id__c",
    "externalId": "ext-123",
    "record": {
      "Name": "Upserted Account"
    }
  }'
*/
