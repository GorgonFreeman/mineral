// https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/resources_sobject_blob_retrieve.htm

const { ArgsWarden, valueProvided } = require('../utils');
const { credsValidator } = require('../validators');
const { salesforceClient } = require('../salesforce/salesforce.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['sobjectType'],
  ['id'],
  ['blobField'],
]);

const salesforceSobjectBlobGet = async (
  credsPayload,
  sobjectType,
  id,
  blobField,
  {
    apiVersion,
    inspect = false,
    fetchClient = salesforceClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    sobjectType,
    id,
    blobField,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'get',
      url: `/sobjects/${ sobjectType }/${ id }/${ blobField }`,
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
  salesforceSobjectBlobGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/salesforceSobjectBlobGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "salesforce" },
    "sobjectType": "Document",
    "id": "015xx0000000001",
    "blobField": "Body"
  }'
*/
