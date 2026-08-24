// https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/resources_composite_sobjects_collections_delete.htm

const { ArgsWarden, valueProvided } = require('../utils');
const { credsValidator } = require('../validators');
const { salesforceClient } = require('../salesforce/salesforce.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['ids'],
]);

const salesforceSobjectCollectionDelete = async (
  credsPayload,
  ids,
  {
    allOrNone,
    apiVersion,
    inspect = false,
    fetchClient = salesforceClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    ids,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const idList = Array.isArray(ids) ? ids.join(',') : ids;

  const params = {
    ids: idList,
  };
  if (allOrNone !== undefined) {
    params.allOrNone = allOrNone;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'delete',
      url: '/composite/sobjects',
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
  salesforceSobjectCollectionDelete,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/salesforceSobjectCollectionDelete" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "salesforce" },
    "ids": ["001xx000003DGb2AAG", "001xx000003DGb3AAG"]
  }'
*/
