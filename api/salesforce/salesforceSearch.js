// https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/resources_search.htm

const { ArgsWarden, valueProvided } = require('../utils');
const { credsValidator } = require('../validators');
const { salesforceClient } = require('../salesforce/salesforce.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['sosl'],
]);

const salesforceSearch = async (
  credsPayload,
  sosl,
  {
    apiVersion,
    inspect = false,
    fetchClient = salesforceClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    sosl,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'get',
      url: '/search',
      params: {
        q: sosl,
      },
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
  salesforceSearch,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/salesforceSearch" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "salesforce" },
    "sosl": "FIND {Acme} IN ALL FIELDS RETURNING Account(Id, Name), Contact(Id, Name)"
  }'
*/
