// https://developers.gorgias.com/reference/get-account

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { gorgiasClient } = require('../gorgias/gorgias.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const gorgiasAccountGet = async (
  credsPayload,
  {
    inspect = false,
    fetchClient = gorgiasClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'get',
      url: '/account',
    },
    context: { credsPayload },
    inspect,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  gorgiasAccountGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/gorgiasAccountGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "gorgias" }
  }'
*/
