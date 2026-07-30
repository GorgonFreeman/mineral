// https://developers.etsy.com/documentation/essentials/authentication/#step-1-request-an-authorization-code

const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { OAUTH_CONNECT_URL, OAUTH_ALL_SCOPES } = require('./etsy.constants');
const { credsValidator } = require('../validators');
const { credsFromPayload, ArgsWarden, FetchClient } = require('../utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const etsyAuthorizationCodeRequest = async (
  credsPayload,
  redirectUrl,
  {
    scopes = OAUTH_ALL_SCOPES,
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

  const state = uuidv4();
  // https://developer.etsy.com/documentation/essentials/authentication/#step-2-grant-access
  console.log('Check this matches the state in the request Etsy makes to the redirect URL:', state);

  const generateRandomString = (length) => {
    return crypto
      .randomBytes(Math.ceil(length * 3 / 4))
      .toString('base64')
      .slice(0, length)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
    ;
  };

  const generatePkce = () => {
    const codeVerifier = generateRandomString(64);
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    ;
  
    return {
      codeVerifier,
      codeChallenge,
    };
  };

  const { codeVerifier, codeChallenge } = generatePkce();
  console.log('codeVerifier:', codeVerifier);
  console.log('codeChallenge:', codeChallenge);

  const response = await new FetchClient().fetch({
    requestPayload: {
      url: OAUTH_CONNECT_URL,
      params: {
        response_type: 'code',
        client_id: API_KEY,
        redirect_uri: redirectUrl,
        scope: scopes.join('%20'),
        state,
        code_challenge: codeChallenge,
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
    "credsPayload": { "credsPath": "etsy" },
    "redirectUrl": "https://www.example.com/some/location",
    "scopes": ["transactions_r", "transactions_w"]
  }'
*/
