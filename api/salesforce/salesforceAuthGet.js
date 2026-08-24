// https://help.salesforce.com/s/articleView?id=xcloud.remoteaccess_oauth_client_credentials_flow_ca.htm
// https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/intro_understanding_authentication.htm

const {
  ArgsWarden,
  appendUrlToBase,
  credsFromPayload,
  customFetch,
} = require('../utils');
const { credsValidator } = require('../validators');
const { DEFAULT_LOGIN_URL } = require('../salesforce/salesforce.constants');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const salesforceAuthGet = async (
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
    ACCESS_TOKEN,
    INSTANCE_URL,
    CLIENT_ID,
    CLIENT_SECRET,
    LOGIN_URL = DEFAULT_LOGIN_URL,
  } = creds ?? {};

  if (ACCESS_TOKEN && INSTANCE_URL) {
    return {
      ok: true,
      data: {
        access_token: ACCESS_TOKEN,
        instance_url: INSTANCE_URL,
      },
    };
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return {
      ok: false,
      error: {
        code: 'INVALID_CREDS',
        message: 'Provide ACCESS_TOKEN and INSTANCE_URL, or CLIENT_ID and CLIENT_SECRET for client credentials.',
      },
    };
  }

  const tokenUrl = appendUrlToBase(LOGIN_URL, '/services/oauth2/token');

  const tokenResponse = await customFetch(tokenUrl, {
    method: 'post',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });

  if (!tokenResponse.ok) {
    return tokenResponse;
  }

  const {
    access_token,
    instance_url,
  } = tokenResponse.data ?? {};

  if (!access_token || !instance_url) {
    return {
      ok: false,
      error: {
        code: 'AUTH_FAILED',
        message: 'Salesforce did not return access_token and instance_url.',
        details: tokenResponse.data,
      },
    };
  }

  return {
    ok: true,
    data: {
      access_token,
      instance_url,
    },
  };
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  salesforceAuthGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/salesforceAuthGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "salesforce" }
  }'
*/
