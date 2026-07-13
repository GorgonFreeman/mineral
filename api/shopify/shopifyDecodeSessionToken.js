// https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens/set-up-session-tokens

const crypto = require('crypto');
const { credsFromPayload, ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');

const sessionTokenValidator = (sessionToken) => {
  return typeof sessionToken === 'string' && Boolean(sessionToken.trim());
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['sessionToken', sessionTokenValidator],
]);

const base64UrlDecodeJson = (input) => {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - base64.length % 4) % 4);

  return JSON.parse(Buffer.from(`${ base64 }${ padding }`, 'base64').toString('utf8'));
};

const normalizeSessionToken = (sessionToken) => {
  const trimmedToken = sessionToken.trim();

  if (trimmedToken.toLowerCase().startsWith('bearer ')) {
    return trimmedToken.slice(7).trim();
  }

  return trimmedToken;
};

const verifySessionTokenSignature = (token, apiSecret) => {
  const [encodedHeader, encodedPayload, signature] = token.split('.');

  if (!encodedHeader || !encodedPayload || !signature) {
    return false;
  }

  const message = `${ encodedHeader }.${ encodedPayload }`;
  const computedSignature = crypto
    .createHmac('sha256', apiSecret)
    .update(message)
    .digest('base64url');

  return computedSignature === signature;
};

const validateSessionTokenClaims = (
  decoded,
  {
    checkAudience = true,
    clientId,
  } = {},
) => {
  const {
    iss,
    dest,
    aud,
    exp,
    nbf,
  } = decoded;

  const currentTime = Math.floor(Date.now() / 1000);
  const expValid = exp > currentTime;
  const nbfValid = nbf <= currentTime;
  const domainsValid = dest?.includes('myshopify.com') && iss?.includes('myshopify.com');
  const audValid = !checkAudience || aud === clientId;

  return expValid && nbfValid && domainsValid && audValid;
};

const decodeSessionTokenPayload = (token) => {
  const encodedPayload = token.split('.')[1];

  if (!encodedPayload) {
    return null;
  }

  try {
    return base64UrlDecodeJson(encodedPayload);
  } catch (error) {
    return null;
  }
};

const shopifyDecodeSessionToken = async (
  credsPayload,
  sessionToken,
  {
    checkAudience = true,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    sessionToken,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const creds = await credsFromPayload(credsPayload);
  const {
    API_SECRET,
    CLIENT_ID,
  } = creds;

  if (!API_SECRET || !CLIENT_ID) {
    return {
      ok: false,
      error: {
        code: 'INVALID_CREDS',
        message: 'API_SECRET and CLIENT_ID are required.',
      },
    };
  }

  const token = normalizeSessionToken(sessionToken);
  const decoded = decodeSessionTokenPayload(token);

  if (!decoded) {
    return {
      ok: false,
      error: {
        code: 'INVALID_SESSION_TOKEN',
        message: 'Session token could not be decoded.',
      },
    };
  }

  if (!verifySessionTokenSignature(token, API_SECRET)) {
    return {
      ok: false,
      error: {
        code: 'INVALID_SESSION_TOKEN',
        message: 'Session token signature is invalid.',
      },
    };
  }

  if (!validateSessionTokenClaims(decoded, {
    checkAudience,
    clientId: CLIENT_ID,
  })) {
    return {
      ok: false,
      error: {
        code: 'INVALID_SESSION_TOKEN',
        message: 'Session token claims are invalid.',
        details: decoded,
      },
    };
  }

  return {
    ok: true,
    data: decoded,
  };
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyDecodeSessionToken,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyDecodeSessionToken" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "tender.prod" },
    "sessionToken": "<jwt>"
  }'
*/
