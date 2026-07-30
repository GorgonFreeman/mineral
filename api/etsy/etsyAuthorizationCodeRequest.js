// https://developers.etsy.com/documentation/essentials/authentication/#step-1-request-an-authorization-code

const { OAUTH_CONNECT_URL } = require('./etsy.constants');
const { credsValidator } = require('../validators');
const { credsFromPayload, ArgsWarden, FetchClient } = require('../utils');

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

  const creds = await credsFromPayload(credsPayload);
  const { API_KEY } = creds;

  const response = await new FetchClient().fetch({
    requestPayload: {
      url: OAUTH_CONNECT_URL,
      params: {
        response_type: 'code',
        client_id: API_KEY,
        // redirect_uri,
        // scope,
        // state,
        // code_challenge,
        code_challenge_method: 'S256',
      },
    },
  });

  return response;
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
