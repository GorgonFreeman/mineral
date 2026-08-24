// https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/resources_composite_sobjects_collections_retrieve.htm

const { ArgsWarden, valueProvided } = require('../utils');
const { credsValidator } = require('../validators');
const { salesforceClient } = require('../salesforce/salesforce.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['sobjectType', valueProvided],
  ['ids', valueProvided],
]);

const salesforceSobjectCollectionGet = async (
  credsPayload,
  sobjectType,
  ids,
  {
    fields,
    apiVersion,
    inspect = false,
    fetchClient = salesforceClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    sobjectType,
    ids,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const idList = Array.isArray(ids) ? ids.join(',') : ids;

  const params = {
    ids: idList,
  };
  if (fields) {
    params.fields = Array.isArray(fields) ? fields.join(',') : fields;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'get',
      url: `/composite/sobjects/${ sobjectType }`,
      params,
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
  salesforceSobjectCollectionGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/salesforceSobjectCollectionGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "salesforce" },
    "sobjectType": "Account",
    "ids": ["001xx000003DGb2AAG"],
    "options": { "fields": ["Id", "Name"] }
  }'
*/
