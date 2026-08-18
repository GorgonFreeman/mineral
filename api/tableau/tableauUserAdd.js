const { ArgsWarden, logDeep } = require('../utils');
const { resolveCreds } = require('../pipelineSteps');
const {
  FetchClient,
  appendUrlToBase,
  fetchClientCommonSteps,
} = require('../utils');

const DEFAULT_API_VERSION = '3.22';

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
        'Content-Type': 'application/json',
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

const argsWarden = new ArgsWarden([
  ['username'],
  ['siteRole'],
]);

// siteRole is the "whatever permissions" lever -> any valid Tableau site
// role: Creator, Explorer, ExplorerCanPublish, Viewer, SiteAdministratorCreator,
// SiteAdministratorExplorer, Unlicensed, etc.
const tableauUserAdd = async (
  username,
  siteRole = 'Viewer',
  {
    authSetting, // optional: 'ServerDefault' | 'SAML' | 'OpenID' | 'TableauIDWithMFA' ...
  } = {},
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    username,
    siteRole,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const response = await tableauClient.fetch({
    context: {
      credsPayload: { credsPath: ['tableau'] },
    },
    requestPayload: {
      url: '/sites/{siteId}/users',
      method: 'post',
      body: {
        user: {
          name: username,
          siteRole,
          ...(authSetting ? { authSetting } : {}),
        },
      },
    },
  });

  const { ok, data, error } = response;
  if (!ok) {
    logDeep({ error });
    return { ok: false, error };
  }

  return {
    ok: true,
    data: data.user ?? data,
  };
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  tableauUserAdd,
  tableauClient,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/tableauUserAdd"
-d '{ "username": "jane.doe@example.com", "siteRole": "Explorer" }'
*/
