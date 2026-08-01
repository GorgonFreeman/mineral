// https://developers.etsy.com/documentation/essentials/authentication/#step-3-request-an-access-token

const { credsValidator } = require('../validators');
const { credsFromPayload, ArgsWarden } = require('../utils');
const { etsyClient } = require('./etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['code'],
  ['redirectUri'],
  ['codeVerifier'],
]);

const etsyAccessTokenRequest = async (
  credsPayload,
  code,
  redirectUri,
  codeVerifier,
  {
    fetchClient = etsyClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    code,
    redirectUri,
    codeVerifier,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const creds = await credsFromPayload(credsPayload);
  const { API_KEY } = creds;

  if (!API_KEY) {
    return {
      ok: false,
      error: {
        code: 'INVALID_CREDS',
        message: 'API_KEY is required.',
      },
    };
  }

  const response = await fetchClient.fetch({
    requestPayload: {
      method: 'post',
      url: '/public/oauth/token',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: API_KEY,
        redirect_uri: redirectUri,
        code,
        code_verifier: codeVerifier,
      }),
    },
    context: { credsPayload },
  });

  if (!response.ok) {
    return response;
  }

  const {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: expiresIn,
    token_type: tokenType,
  } = response.data ?? {};

  if (!accessToken || !refreshToken) {
    return {
      ok: false,
      error: {
        code: 'TOKEN_RESPONSE_INCOMPLETE',
        message: 'Etsy did not return access_token and refresh_token.',
        details: response.data,
      },
    };
  }

  return {
    ok: true,
    data: {
      accessToken,
      refreshToken,
      expiresIn,
      tokenType,
    },
  };
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  etsyAccessTokenRequest,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/etsyAccessTokenRequest" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": {
      "credsPath": "etsy"
    },
    "code": "YOUR_CODE",
    "redirectUri": "https://YOUR_NGROK/logEtsyAuthCodeResponse",
    "codeVerifier": "YOUR_CODE_VERIFIER"
  }'
*/
