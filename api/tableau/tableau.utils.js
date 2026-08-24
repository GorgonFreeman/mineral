const { DEFAULT_API_VERSION } = require('../tableau/tableau.constants');
const { resolveCreds } = require('../pipelineSteps');
const {
  FetchClient,
  appendUrlToBase,
  fetchClientCommonSteps,
} = require('../utils');

// Tableau sessions are token-based (sign in -> token, valid ~2hrs by default
// server config), unlike Shopify's static API key. We cache tokens per
// server+site so we're not re-signing-in on every single call.
const tokenCache = new Map();

const tableauSignIn = async ({
  SERVER_URL,
  PAT_NAME,
  PAT_SECRET,
  SITE_CONTENT_URL = '',
}) => {
  const cacheKey = `${ SERVER_URL }::${ SITE_CONTENT_URL }`;
  const cached = tokenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached;
  }

  const response = await fetch(`${ SERVER_URL }/api/${ DEFAULT_API_VERSION }/auth/signin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      credentials: {
        personalAccessTokenName: PAT_NAME,
        personalAccessTokenSecret: PAT_SECRET,
        site: { contentUrl: SITE_CONTENT_URL },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Tableau sign-in failed: ${ response.status } ${ await response.text() }`);
  }

  const { credentials } = await response.json();

  const session = {
    token: credentials.token,
    siteId: credentials.site.id,
    // Refresh a bit early rather than riding right up against the server's
    // idle/absolute timeout.
    expiresAt: Date.now() + 1000 * 60 * 60 * 2,
  };

  tokenCache.set(cacheKey, session);
  return session;
};

const useUrlAndAuthHeaders = async (state) => {
  const { requestPayload, context } = state;
  const { creds } = context;

  const { token, siteId } = await tableauSignIn(creds);

  return {
    requestPayload: {
      ...requestPayload,
      url: appendUrlToBase(
        `${ creds.SERVER_URL }/api/${ DEFAULT_API_VERSION }`,
        requestPayload.url.replace('{siteId}', siteId),
      ),
      headers: {
        'X-Tableau-Auth': token,
        Accept: 'application/json',
        ...requestPayload.headers,
      },
    },
  };
};

const tableauClient = new FetchClient({
  pipeline: [
    resolveCreds,
    useUrlAndAuthHeaders,
    'fetch',
    fetchClientCommonSteps.exitEarlyOnNotOk,
  ],
});

module.exports = {
  tableauClient,
  tableauSignIn,
};
