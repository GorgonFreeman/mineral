// https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/resources_query.htm
// https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/intro_understanding_authentication.htm

const {
  ArgsWarden,
  appendUrlToBase,
  credsFromPayload,
  customFetch,
  valueProvided,
} = require('../utils');
const { credsValidator } = require('../validators');

const DEFAULT_API_VERSION = '62.0';
const DEFAULT_LOGIN_URL = 'https://login.salesforce.com';

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['soql', valueProvided],
]);

const resolveAccess = async (creds) => {
  const {
    ACCESS_TOKEN,
    INSTANCE_URL,
    CLIENT_ID,
    CLIENT_SECRET,
    LOGIN_URL = DEFAULT_LOGIN_URL,
  } = creds;

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

const salesforceQuery = async (
  credsPayload,
  soql,
  {
    apiVersion,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    soql,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const creds = await credsFromPayload(credsPayload);

  const accessResponse = await resolveAccess(creds);
  if (!accessResponse.ok) {
    return accessResponse;
  }

  const {
    access_token,
    instance_url,
  } = accessResponse.data;

  const version = apiVersion
    ?? creds.API_VERSION
    ?? DEFAULT_API_VERSION;

  const url = appendUrlToBase(
    instance_url,
    `/services/data/v${ version }/query`,
  );

  const response = await customFetch(url, {
    method: 'get',
    headers: {
      Authorization: `Bearer ${ access_token }`,
    },
    params: {
      q: soql,
    },
  });

  if (!response.ok) {
    return response;
  }

  // Unwrap to the standard shape: data is the resource payload
  // (records, totalSize, done, nextRecordsUrl, …)
  return {
    ok: true,
    data: response.data,
  };
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  salesforceQuery,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/salesforceQuery" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "salesforce" },
    "soql": "SELECT Id, Name FROM Account LIMIT 5"
  }'
*/
