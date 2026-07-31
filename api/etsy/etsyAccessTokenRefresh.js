// https://developers.etsy.com/documentation/essentials/authentication#requesting-an-oauth-token

const { credsValidator } = require('../validators');
const { credsFromPayload, ArgsWarden } = require('../utils');
const { etsyClient } = require('./etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const etsyAccessTokenRefresh = async (
  credsPayload,
  refreshToken,
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const creds = await credsFromPayload(credsPayload);
  const { API_KEY, REFRESH_TOKEN } = creds;
  const token = refreshToken ?? REFRESH_TOKEN;

  if (!API_KEY || !token) {
    return {
      ok: false,
      error: {
        code: 'INVALID_CREDS',
        message: 'API_KEY and REFRESH_TOKEN are required.',
      },
    };
  }

  const response = await etsyClient.fetch({
    requestPayload: {
      method: 'post',
      url: '/public/oauth/token',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: API_KEY,
        refresh_token: token,
      }),
    },
    context: { credsPayload },
  });

  if (!response.ok) {
    return response;
  }

  const {
    access_token: accessToken,
    refresh_token: newRefreshToken,
    expires_in: expiresIn,
    token_type: tokenType,
  } = response.data ?? {};

  if (!accessToken || !newRefreshToken) {
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
      refreshToken: newRefreshToken,
      expiresIn,
      tokenType,
    },
  };
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  etsyAccessTokenRefresh,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/etsyAccessTokenRefresh" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "etsy" }
  }'
*/
