// https://developers.etsy.com/documentation/reference/#operation/ping

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyClient } = require('../etsy/etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const etsyPing = async (
  credsPayload,
  {
    fetchClient = etsyClient,
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
      url: '/application/openapi-ping',
    },
    context: { credsPayload },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  etsyPing,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/etsyPing" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": {
      "credsPath": "etsy"
    }
  }'
*/
