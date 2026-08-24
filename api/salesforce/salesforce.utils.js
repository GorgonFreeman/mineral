const {
  DEFAULT_API_VERSION,
  DEFAULT_LOGIN_URL,
} = require('../salesforce/salesforce.constants');
const { resolveCreds } = require('../pipelineSteps');
const {
  FetchClient,
  appendUrlToBase,
  customFetch,
  fetchClientCommonSteps,
} = require('../utils');

/**
 * Resolve access_token + instance_url from creds.
 * Supports pre-issued ACCESS_TOKEN + INSTANCE_URL, or OAuth client_credentials
 * via CLIENT_ID + CLIENT_SECRET (+ optional LOGIN_URL).
 */
const resolveAccess = async (creds) => {
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

const useUrlAndAuthHeaders = async (state) => {
  const { requestPayload, context } = state;
  const {
    apiVersion = DEFAULT_API_VERSION,
    creds,
  } = context;

  const accessResponse = await resolveAccess(creds);
  if (!accessResponse?.ok) {
    return {
      breakChain: true,
      response: accessResponse,
    };
  }

  const {
    access_token,
    instance_url,
  } = accessResponse.data;

  const dataBase = appendUrlToBase(
    instance_url,
    `/services/data/v${ apiVersion }`,
  );

  return {
    requestPayload: {
      ...requestPayload,
      url: appendUrlToBase(dataBase, requestPayload.url),
      headers: {
        Authorization: `Bearer ${ access_token }`,
        ...requestPayload.headers,
      },
    },
  };
};

const salesforceClient = new FetchClient({
  pipeline: [
    resolveCreds,
    useUrlAndAuthHeaders,
    'fetch',
    fetchClientCommonSteps.exitEarlyOnNotOk,
  ],
});

module.exports = {
  resolveAccess,
  salesforceClient,
};
