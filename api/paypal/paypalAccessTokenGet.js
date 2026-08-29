// https://developer.paypal.com/api/rest/authentication/

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const {
  resolveAccessToken,
  baseUrlForCreds,
  getClientCredentialsToken,
} = require('../paypal/paypal.utils');
const { resolveCreds } = require('../pipelineSteps');
const { credsFromPayload } = require('../utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

/**
 * Resolve (and cache) a PayPal access token for the given creds.
 * Useful for debugging auth or for callers that need the raw token.
 */
const paypalAccessTokenGet = async (
  credsPayload,
  {
    forceRefresh = false,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  try {
    const creds = await credsFromPayload(credsPayload);

    if (forceRefresh && creds?.CLIENT_ID) {
      const { clientCredentialsTokenCache } = require('../paypal/paypal.utils');
      const env = (creds.SANDBOX === true || creds.SANDBOX === 'true'
        || creds.ENVIRONMENT === 'sandbox' || creds.MODE === 'sandbox')
        ? 'sandbox'
        : 'live';
      clientCredentialsTokenCache.delete(`${ env }:${ creds.CLIENT_ID }`);
    }

    const accessToken = await resolveAccessToken(creds);
    return {
      ok: true,
      data: {
        access_token: accessToken,
        base_url: baseUrlForCreds(creds),
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: {
        code: 'PAYPAL_AUTH_FAILED',
        message: err.message || String(err),
      },
    };
  }
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  paypalAccessTokenGet,
  funcApiConfig,
};

/*
  curl -X POST "http://localhost:8000/paypalAccessTokenGet" \
    -H "Content-Type: application/json" \
    -d '{
      "credsPayload": { "credsPath": "paypal.personal" }
    }'
*/
