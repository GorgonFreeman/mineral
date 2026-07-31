// https://developers.etsy.com/documentation/essentials/authentication/#step-2-grant-access

const crypto = require('crypto');

const usedOauthStates = new Set();

const codeChallengeFromVerifier = (codeVerifier) => (
  crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
);

const redirectOriginAndPath = (urlString) => {
  const { origin, pathname } = new URL(urlString);
  return `${ origin }${ pathname }`;
};

const validateCallbackTarget = (parsedUrl, expectedRedirectUrl) => {
  if (!expectedRedirectUrl) {
    return null;
  }

  const expected = redirectOriginAndPath(expectedRedirectUrl);
  const actual = redirectOriginAndPath(parsedUrl.href);

  if (actual !== expected) {
    return {
      ok: false,
      error: {
        code: 'REDIRECT_URL_MISMATCH',
        message: 'Callback origin and path must exactly match the redirect_uri used in the authorization request (case-sensitive, no extra trailing slash).',
        details: { expected, actual },
      },
    };
  }

  if (!expectedRedirectUrl.startsWith('https://')) {
    return {
      ok: false,
      error: {
        code: 'REDIRECT_URL_NOT_HTTPS',
        message: 'Etsy redirect URIs must use https://.',
      },
    };
  }

  return null;
};

const validateState = (params, expectedState) => {
  if (!expectedState) {
    return {
      ok: false,
      error: {
        code: 'MISSING_EXPECTED_STATE',
        message: 'expectedState is required to validate the OAuth callback.',
      },
    };
  }

  const state = params.get('state');

  if (!state) {
    return {
      ok: false,
      error: {
        code: 'MISSING_STATE',
        message: 'Redirect URL has no state parameter.',
      },
    };
  }

  if (state !== expectedState) {
    return {
      ok: false,
      error: {
        code: 'STATE_MISMATCH',
        message: 'State does not match the authorization request; halt authentication (CSRF).',
        details: { expectedState, state },
      },
    };
  }

  if (usedOauthStates.has(state)) {
    return {
      ok: false,
      error: {
        code: 'STATE_ALREADY_USED',
        message: 'This state was already consumed; start a new authorization request.',
      },
    };
  }

  return { ok: true, state };
};

const etsyOauthRedirectParse = ({
  resultingUrl,
  expectedState,
  codeVerifier,
  expectedCodeChallenge,
  expectedRedirectUrl,
}) => {

  let parsedUrl;
  try {
    parsedUrl = new URL(resultingUrl);
  } catch {
    return {
      ok: false,
      error: {
        code: 'INVALID_REDIRECT_URL',
        message: 'Could not parse the redirect URL.',
      },
    };
  }

  const targetError = validateCallbackTarget(parsedUrl, expectedRedirectUrl);
  if (targetError) {
    return targetError;
  }

  const params = parsedUrl.searchParams;

  const stateResult = validateState(params, expectedState);
  if (!stateResult.ok) {
    return stateResult;
  }

  const { state } = stateResult;

  const oauthError = params.get('error');
  if (oauthError) {
    return {
      ok: false,
      error: {
        code: 'OAUTH_ERROR',
        message: params.get('error_description') ?? oauthError,
        details: {
          error: oauthError,
          errorUri: params.get('error_uri'),
          state,
        },
      },
    };
  }

  const code = params.get('code');
  if (!code) {
    return {
      ok: false,
      error: {
        code: 'MISSING_CODE',
        message: 'Redirect URL has no authorization code.',
      },
    };
  }

  if (!codeVerifier || !expectedCodeChallenge) {
    return {
      ok: false,
      error: {
        code: 'MISSING_PKCE',
        message: 'codeVerifier and expectedCodeChallenge are required for this authorization flow.',
      },
    };
  }

  const challengeFromVerifier = codeChallengeFromVerifier(codeVerifier);
  if (challengeFromVerifier !== expectedCodeChallenge) {
    return {
      ok: false,
      error: {
        code: 'PKCE_MISMATCH',
        message: 'Code verifier does not match the code challenge from this authorization request.',
      },
    };
  }

  usedOauthStates.add(state);

  return {
    ok: true,
    data: {
      code,
      state,
      codeVerifier,
      redirectUri: expectedRedirectUrl,
      iss: params.get('iss'),
    },
  };
};

module.exports = {
  etsyOauthRedirectParse,
  codeChallengeFromVerifier,
};
