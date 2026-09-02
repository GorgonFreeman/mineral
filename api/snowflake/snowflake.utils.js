const crypto = require('crypto');

const {
  JWT_LIFETIME_SECONDS,
} = require('../snowflake/snowflake.constants');
const { resolveCreds } = require('../pipelineSteps');
const {
  FetchClient,
  appendUrlToBase,
  fetchClientCommonSteps,
  customFetch,
} = require('../utils');

const jwtCache = new Map();
const oauthAccessTokenCache = new Map();

const base64Url = (input) => {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

const normalizeAccountForJwt = (account) => {
  return String(account || '')
    .trim()
    .replace(/\./g, '-')
    .toUpperCase();
};

const loadPrivateKeyObject = (privateKeyPem, passphrase) => {
  const keyInput = {
    key: privateKeyPem,
    format: 'pem',
  };
  if (passphrase) {
    keyInput.passphrase = passphrase;
  }
  return crypto.createPrivateKey(keyInput);
};

const publicKeyFingerprint = (privateKeyObject) => {
  const publicKeyDer = crypto
    .createPublicKey(privateKeyObject)
    .export({ type: 'spki', format: 'der' });
  const hash = crypto.createHash('sha256').update(publicKeyDer).digest('base64');
  return `SHA256:${ hash }`;
};

const signJwtRs256 = (payload, privateKeyObject) => {
  const header = { alg: 'RS256', typ: 'JWT' };
  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const data = `${ encodedHeader }.${ encodedPayload }`;
  const signature = crypto.sign('RSA-SHA256', Buffer.from(data), privateKeyObject);
  return `${ data }.${ base64Url(signature) }`;
};

const generateKeyPairJwt = ({
  ACCOUNT,
  USER,
  PRIVATE_KEY,
  PRIVATE_KEY_PASSPHRASE,
  PUBLIC_KEY_FP,
}) => {
  const privateKeyObject = loadPrivateKeyObject(
    PRIVATE_KEY,
    PRIVATE_KEY_PASSPHRASE,
  );
  const fingerprint = PUBLIC_KEY_FP || publicKeyFingerprint(privateKeyObject);
  const account = normalizeAccountForJwt(ACCOUNT);
  const user = String(USER || '').toUpperCase();
  const qualifiedUsername = `${ account }.${ user }`;
  const nowSeconds = Math.floor(Date.now() / 1000);

  const payload = {
    iss: `${ qualifiedUsername }.${ fingerprint }`,
    sub: qualifiedUsername,
    iat: nowSeconds,
    exp: nowSeconds + JWT_LIFETIME_SECONDS,
  };

  return signJwtRs256(payload, privateKeyObject);
};

const accountBaseUrl = (accountOrBase) => {
  const raw = String(accountOrBase || '').trim();
  if (/^https?:\/\//i.test(raw)) {
    return raw.replace(/\/$/, '');
  }
  const host = raw
    .replace(/\.snowflakecomputing\.com.*$/i, '');
  return `https://${ host }.snowflakecomputing.com`;
};

const formEncode = (obj) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) {
      continue;
    }
    search.append(key, value);
  }
  return search.toString();
};

const mintOauthAccessToken = async (creds) => {
  const {
    ACCOUNT,
    BASE_URL,
    CLIENT_ID,
    CLIENT_SECRET,
    REFRESH_TOKEN,
    AUTH_CODE,
    REDIRECT_URI = 'http://localhost',
  } = creds;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('snowflake OAuth requires CLIENT_ID and CLIENT_SECRET');
  }

  const baseUrl = accountBaseUrl(BASE_URL || ACCOUNT);
  const basic = Buffer
    .from(`${ CLIENT_ID }:${ CLIENT_SECRET }`)
    .toString('base64');

  let body;
  if (REFRESH_TOKEN) {
    body = formEncode({
      grant_type: 'refresh_token',
      refresh_token: REFRESH_TOKEN,
    });
  } else if (AUTH_CODE) {
    body = formEncode({
      grant_type: 'authorization_code',
      code: AUTH_CODE,
      redirect_uri: REDIRECT_URI,
    });
  } else {
    throw new Error(
      'snowflake OAuth requires REFRESH_TOKEN or AUTH_CODE alongside CLIENT_ID/SECRET',
    );
  }

  const response = await customFetch(
    `${ baseUrl }/oauth/token-request`,
    {
      method: 'post',
      headers: {
        Authorization: `Basic ${ basic }`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    },
  );

  if (!response.ok) {
    throw new Error(
      `Snowflake OAuth token request failed: ${ JSON.stringify(response.error ?? response.data) }`,
    );
  }

  const {
    access_token: accessToken,
    expires_in: expiresIn = 600,
    refresh_token: newRefreshToken,
  } = response.data ?? {};

  if (!accessToken) {
    throw new Error('Snowflake OAuth response missing access_token');
  }

  return {
    accessToken,
    expiresIn,
    refreshToken: newRefreshToken,
  };
};

const resolveSnowflakeAuth = async (creds) => {
  if (creds?.ACCESS_TOKEN) {
    return {
      token: creds.ACCESS_TOKEN,
      tokenType: creds.TOKEN_TYPE || 'OAUTH',
    };
  }

  if (creds?.PRIVATE_KEY && creds?.ACCOUNT && creds?.USER) {
    const cacheKey = [
      creds.ACCOUNT,
      creds.USER,
      crypto.createHash('sha256').update(creds.PRIVATE_KEY).digest('hex').slice(0, 16),
    ].join('::');

    const cached = jwtCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now() + 120_000) {
      return {
        token: cached.token,
        tokenType: 'KEYPAIR_JWT',
      };
    }

    const token = generateKeyPairJwt(creds);
    jwtCache.set(cacheKey, {
      token,
      expiresAt: Date.now() + JWT_LIFETIME_SECONDS * 1000,
    });

    return {
      token,
      tokenType: 'KEYPAIR_JWT',
    };
  }

  // OAuth client credentials-style refresh (no Upstash; in-process cache only)
  if (creds?.CLIENT_ID && creds?.CLIENT_SECRET && (creds?.REFRESH_TOKEN || creds?.AUTH_CODE)) {
    const cacheKey = `${ creds.CLIENT_ID }::${ creds.ACCOUNT || creds.BASE_URL || '' }`;
    const cached = oauthAccessTokenCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now() + 30_000) {
      return {
        token: cached.token,
        tokenType: 'OAUTH',
      };
    }

    const minted = await mintOauthAccessToken(creds);
    oauthAccessTokenCache.set(cacheKey, {
      token: minted.accessToken,
      expiresAt: Date.now() + (minted.expiresIn - 30) * 1000,
    });

    return {
      token: minted.accessToken,
      tokenType: 'OAUTH',
    };
  }

  throw new Error(
    'snowflake creds require ACCESS_TOKEN, or ACCOUNT + USER + PRIVATE_KEY, or CLIENT_ID + CLIENT_SECRET + REFRESH_TOKEN|AUTH_CODE',
  );
};

const useUrlAndAuthHeaders = async (state) => {
  const { requestPayload, context } = state;
  const { creds } = context;

  const { token, tokenType } = await resolveSnowflakeAuth(creds);
  const baseUrl = accountBaseUrl(creds.BASE_URL || creds.ACCOUNT);

  return {
    requestPayload: {
      ...requestPayload,
      url: appendUrlToBase(baseUrl, requestPayload.url),
      headers: {
        Authorization: `Bearer ${ token }`,
        'X-Snowflake-Authorization-Token-Type': tokenType,
        Accept: 'application/json',
        'User-Agent': 'mineral/snowflake',
        ...requestPayload.headers,
      },
    },
  };
};

const snowflakeClient = new FetchClient({
  pipeline: [
    resolveCreds,
    useUrlAndAuthHeaders,
    'fetch',
    fetchClientCommonSteps.exitEarlyOnNotOk,
  ],
});

const mapRows = (resultSet) => {
  const columns = resultSet?.resultSetMetaData?.rowType ?? [];
  const data = resultSet?.data ?? [];

  if (!columns.length) {
    return data;
  }

  const names = columns.map((col) => col.name);
  return data.map((row) => {
    const obj = {};
    for (let i = 0; i < names.length; i += 1) {
      obj[names[i]] = row[i] ?? null;
    }
    return obj;
  });
};

const sessionContextFromCreds = (creds = {}, overrides = {}) => {
  const {
    WAREHOUSE,
    DATABASE,
    SCHEMA,
    ROLE,
  } = creds;

  return {
    ...(WAREHOUSE || overrides.warehouse ? {
      warehouse: overrides.warehouse ?? WAREHOUSE,
    } : {}),
    ...(DATABASE || overrides.database ? {
      database: overrides.database ?? DATABASE,
    } : {}),
    ...(SCHEMA || overrides.schema ? {
      schema: overrides.schema ?? SCHEMA,
    } : {}),
    ...(ROLE || overrides.role ? {
      role: overrides.role ?? ROLE,
    } : {}),
  };
};

module.exports = {
  snowflakeClient,
  resolveSnowflakeAuth,
  generateKeyPairJwt,
  mintOauthAccessToken,
  mapRows,
  sessionContextFromCreds,
  accountBaseUrl,
};
