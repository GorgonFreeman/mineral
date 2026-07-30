// https://developers.etsy.com/documentation/essentials/authentication/#step-1-request-an-authorization-code

const { execFile } = require('child_process');
const { promisify } = require('util');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { OAUTH_CONNECT_URL, OAUTH_ALL_SCOPES } = require('./etsy.constants');
const { credsValidator } = require('../validators');
const { credsFromPayload, ArgsWarden } = require('../utils');

const execFileAsync = promisify(execFile);

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['redirectUrl'],
]);

const buildAuthorizationUrl = (params) => {
  const search = new URLSearchParams(params).toString().replace(/\+/g, '%20');
  return `${ OAUTH_CONNECT_URL }?${ search }`;
};

const generateRandomString = (length) => (
  crypto
    .randomBytes(Math.ceil(length * 3 / 4))
    .toString('base64')
    .slice(0, length)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
);

const generatePkce = () => {
  const codeVerifier = generateRandomString(64);
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return {
    codeVerifier,
    codeChallenge,
  };
};

const etsyAuthorizationCodeRequest = async (
  credsPayload,
  redirectUrl,
  {
    scopes = OAUTH_ALL_SCOPES,
    openAuthUrl = false,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    redirectUrl,
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

  const state = uuidv4();
  const { codeVerifier, codeChallenge } = generatePkce();

  const url = buildAuthorizationUrl({
    response_type: 'code',
    client_id: API_KEY,
    redirect_uri: redirectUrl,
    scope: scopes.join(' '),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  if (openAuthUrl) {
    // TODO: support non-Macs
    await execFileAsync('open', [url]);
  }

  return {
    ok: true,
    data: {
      state,
      codeVerifier,
      ...!openAuthUrl && { url },
    },
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
    "credsPayload": { "credsPath": "etsy" },
    "redirectUrl": "https://06b6-59-154-120-174.ngrok-free.app/log"
  }'
*/

