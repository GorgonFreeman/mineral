// https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/resources_query.htm

const { ArgsWarden, valueProvided } = require('../utils');
const { credsValidator } = require('../validators');
const { salesforceClient } = require('../salesforce/salesforce.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['soql'],
]);

const salesforceQuery = async (
  credsPayload,
  soql,
  {
    apiVersion,
    inspect = false,
    fetchClient = salesforceClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    soql,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'get',
      url: '/query',
      params: {
        q: soql,
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
  salesforceQuery,
  funcApiConfig,
};

/*
  curl -X POST "http://localhost:8000/salesforceQuery" \
    -H "Content-Type: application/json" \
    -d '{
      "credsPayload": { "credsPath": "salesforce" },
      "soql": "SELECT Id, Name FROM Account LIMIT 5"
    }'

  curl -X POST "http://localhost:8000/salesforceQuery" \
    -H "Content-Type: application/json" \
    -d '{
      "credsPayload": {"credsPath": "salesforce"},
      "soql": "SELECT Id, Name, Email, Phone, Account.Name FROM Contact ORDER BY LastModifiedDate DESC LIMIT 10"
    }'
*/
