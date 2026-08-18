// GET /api/{api-version}/sites/{site-id}/users is paginated (default pageSize
// is 100, max 1000), so this walks all pages and returns the full list.

const { ArgsWarden, logDeep } = require('../utils');
const { resolveCreds } = require('../pipelineSteps');
const {
  FetchClient,
  appendUrlToBase,
  fetchClientCommonSteps,
} = require('../utils');

const DEFAULT_API_VERSION = '3.22';
const PAGE_SIZE = 1000; // Tableau's max page size

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

const argsWarden = new ArgsWarden([]);

// Optional filter, e.g. { filter: "siteRole:eq:Explorer" } or
// { filter: "name:has:jane" } per Tableau's filter-expression syntax.
const tableauUsersGet = async ({ filter } = {}) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({});
  if (rejectResponse) {
    return rejectResponse;
  }

  const users = [];
  let pageNumber = 1;

  while (true) {
    const query = new URLSearchParams({
      pageSize: String(PAGE_SIZE),
      pageNumber: String(pageNumber),
      ...(filter ? { filter } : {}),
    });

    const response = await tableauClient.run({
      context: {
        credsPath: ['tableau'],
      },
      requestPayload: {
        url: `/sites/{siteId}/users?${ query.toString() }`,
        method: 'GET',
      },
    });

    const { ok, data, error } = response;
    if (!ok) {
      logDeep({ error });
      return { ok: false, error };
    }

    const pageUsers = data?.users?.user ?? [];
    users.push(...pageUsers);

    const totalAvailable = Number(data?.pagination?.totalAvailable ?? pageUsers.length);
    if (users.length >= totalAvailable || pageUsers.length === 0) {
      break;
    }

    pageNumber += 1;
  }

  return {
    ok: true,
    data: users,
  };
};

module.exports = {
  tableauUsersGet,
  tableauClient,
};

/*
curl -X POST "http://localhost:8000/tableauUsersGet"

curl -X POST "http://localhost:8000/tableauUsersGet"
-d '{ "filter": "siteRole:eq:Creator" }'
*/
