const {
  SPOTIFY_API_BASE_URL,
  SPOTIFY_ACCOUNTS_BASE_URL,
} = require('../spotify/spotify.constants');
const { resolveCreds, useBaseUrl } = require('../pipelineSteps');
const {
  FetchClient,
  fetchClientCommonSteps,
  customFetch,
  credsFromPayload,
} = require('../utils');

// Cache client-credentials tokens per CLIENT_ID so we are not minting on every call.
const clientCredentialsTokenCache = new Map();

const getClientCredentialsToken = async ({ CLIENT_ID, CLIENT_SECRET }) => {
  const cacheKey = CLIENT_ID;
  const cached = clientCredentialsTokenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.accessToken;
  }

  const basic = Buffer
    .from(`${ CLIENT_ID }:${ CLIENT_SECRET }`)
    .toString('base64');

  const response = await customFetch(
    `${ SPOTIFY_ACCOUNTS_BASE_URL }/api/token`,
    {
      method: 'post',
      headers: {
        Authorization: `Basic ${ basic }`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    },
  );

  if (!response.ok) {
    throw new Error(
      `Spotify client_credentials failed: ${ JSON.stringify(response.error ?? response.data) }`,
    );
  }

  const { access_token: accessToken, expires_in: expiresIn = 3600 } = response.data ?? {};
  if (!accessToken) {
    throw new Error('Spotify client_credentials response missing access_token');
  }

  clientCredentialsTokenCache.set(cacheKey, {
    accessToken,
    // Refresh a minute early.
    expiresAt: Date.now() + (expiresIn - 60) * 1000,
  });

  return accessToken;
};

const resolveAccessToken = async (creds) => {
  if (creds?.ACCESS_TOKEN) {
    return creds.ACCESS_TOKEN;
  }

  const { CLIENT_ID, CLIENT_SECRET } = creds ?? {};
  if (CLIENT_ID && CLIENT_SECRET) {
    return getClientCredentialsToken({ CLIENT_ID, CLIENT_SECRET });
  }

  throw new Error(
    'spotify creds require ACCESS_TOKEN or CLIENT_ID + CLIENT_SECRET',
  );
};

const useAuthHeaders = async (state) => {
  const { requestPayload, context } = state;
  const { creds } = context;

  const accessToken = await resolveAccessToken(creds);

  return {
    requestPayload: {
      ...requestPayload,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${ accessToken }`,
        ...requestPayload.headers,
      },
    },
  };
};

const spotifyClient = new FetchClient({
  pipeline: [
    resolveCreds,
    useBaseUrl(SPOTIFY_API_BASE_URL),
    useAuthHeaders,
    'fetch',
    fetchClientCommonSteps.exitEarlyOnNotOk,
  ],
});

module.exports = {
  spotifyClient,
  resolveAccessToken,
  getClientCredentialsToken,
};
