// https://loyaltyapi.yotpo.com/reference/fetch-vip-tiers

const { credsFromPayload, ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { yotpoClient } = require('../yotpo/yotpo.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const yotpoVipTiersGet = async (
  credsPayload,
  {
    apiVersion,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({ credsPayload });
  if (rejectResponse) {
    return rejectResponse;
  }

  const creds = await credsFromPayload(credsPayload);

  const response = await yotpoClient.fetch({
    url: '/vip_tiers',
    context: {
      creds,
      apiVersion,
    },
  });

  return response;
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  yotpoVipTiersGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/yotpoVipTiersGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "yotpo.au" }
  }'
*/
