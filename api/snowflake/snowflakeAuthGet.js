// https://docs.snowflake.com/en/user-guide/oauth-custom
// Mint or return an access token. Prefer ACCESS_TOKEN in creds for steady-state;
// use CLIENT_ID + CLIENT_SECRET + REFRESH_TOKEN|AUTH_CODE to mint.

const { ArgsWarden, logDeep } = require('../utils');
const { credsValidator } = require('../validators');
const {
  resolveSnowflakeAuth,
  mintOauthAccessToken,
} = require('../snowflake/snowflake.utils');
const { credsFromPayload } = require('../utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const snowflakeAuthGet = async (
  credsPayload,
  {
    forceRefresh = false,
  } = {},
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  try {
    const creds = await credsFromPayload(credsPayload);

    if (forceRefresh && creds.CLIENT_ID && creds.CLIENT_SECRET) {
      const minted = await mintOauthAccessToken(creds);
      return {
        ok: true,
        data: {
          accessToken: minted.accessToken,
          expiresIn: minted.expiresIn,
          ...(minted.refreshToken ? { refreshToken: minted.refreshToken } : {}),
        },
      };
    }

    const { token, tokenType } = await resolveSnowflakeAuth(creds);
    return {
      ok: true,
      data: {
        accessToken: token,
        tokenType,
      },
    };
  } catch (error) {
    logDeep({ error });
    return {
      ok: false,
      error: {
        code: 'AUTH_FAILED',
        message: error?.message || 'Failed to resolve Snowflake access token',
        details: error,
      },
    };
  }
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  snowflakeAuthGet,
  funcApiConfig,
};
