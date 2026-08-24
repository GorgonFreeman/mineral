// https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/resources_versions.htm

const {
  ArgsWarden,
  appendUrlToBase,
  customFetch,
} = require('../utils');
const { credsValidator } = require('../validators');
const { salesforceAuthGet } = require('../salesforce/salesforceAuthGet');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

// Versions live at {instance}/services/data/ (no vXX.X segment).
const salesforceVersionsGet = async (
  credsPayload,
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const authResponse = await salesforceAuthGet(credsPayload);
  if (!authResponse.ok) {
    return authResponse;
  }

  const {
    access_token,
    instance_url,
  } = authResponse.data;

  const url = appendUrlToBase(instance_url, '/services/data');

  return customFetch(url, {
    method: 'get',
    headers: {
      Authorization: `Bearer ${ access_token }`,
    },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  salesforceVersionsGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/salesforceVersionsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "salesforce" }
  }'
*/
