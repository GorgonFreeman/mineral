// https://developers.etsy.com/documentation/essentials/authentication/#step-1-request-an-authorization-code

const { OAUTH_CONNECT_URL } = require('./etsy.constants');
const { credsValidator } = require('../validators');
const { credsFromPayload, ArgsWarden } = require('../utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const etsyAuthorizationCodeRequest = async (
  credsPayload,
  {
    option,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({ 
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return {
    ok: true,
    url: OAUTH_CONNECT_URL,
  };
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  etsyAuthorizationCodeRequest,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/etsyAuthorizationCodeRequest" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "etsy" }
  }'
*/
