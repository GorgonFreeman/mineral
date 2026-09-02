// https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/access-token-s2s.html

const {
  ArgsWarden,
  appendUrlToBase,
  credsFromPayload,
  customFetch,
} = require('../utils');
const { credsValidator } = require('../validators');
const { TOKEN_PATH } = require('../marketingcloud/marketingcloud.constants');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const marketingcloudAuthGet = async (
  credsPayload,
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const creds = await credsFromPayload(credsPayload);
  const {
    CLIENT_ID,
    CLIENT_SECRET,
    AUTH_URL,
    ACCOUNT_ID,
  } = creds ?? {};

  if (!CLIENT_ID || !CLIENT_SECRET || !AUTH_URL) {
    return {
      ok: false,
      error: {
        code: 'INVALID_CREDS',
        message: 'Provide CLIENT_ID, CLIENT_SECRET, and AUTH_URL for Marketing Cloud.',
      },
    };
  }

  const authBase = AUTH_URL.replace(/\/$/, '');
  const tokenUrl = appendUrlToBase(authBase, TOKEN_PATH);

  const body = {
    grant_type: 'client_credentials',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  };

  if (ACCOUNT_ID) {
    body.account_id = ACCOUNT_ID;
  }

  const tokenResponse = await customFetch(tokenUrl, {
    method: 'post',
    body,
  });

  if (!tokenResponse.ok) {
    return tokenResponse;
  }

  const {
    access_token,
    rest_instance_url,
    soap_instance_url,
    expires_in,
  } = tokenResponse.data ?? {};

  if (!access_token) {
    return {
      ok: false,
      error: {
        code: 'AUTH_FAILED',
        message: 'Marketing Cloud did not return access_token.',
        details: tokenResponse.data,
      },
    };
  }

  return {
    ok: true,
    data: {
      access_token,
      rest_instance_url: rest_instance_url || creds.REST_URL?.replace(/\/$/, ''),
      soap_instance_url: soap_instance_url || creds.SOAP_URL?.replace(/\/$/, ''),
      expires_in,
    },
  };
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  marketingcloudAuthGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/marketingcloudAuthGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "marketingcloud" }
  }'
*/
