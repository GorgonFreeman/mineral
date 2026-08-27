// https://developer.spotify.com/documentation/web-api/reference/get-information-about-the-users-current-playback

const { ArgsWarden, logDeep } = require('../utils');
const { credsValidator } = require('../validators');
const { spotifyClient } = require('../spotify/spotify.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const spotifyPlayerGet = async (
  credsPayload,
  {
    market,
    additionalTypes,
    fetchClient = spotifyClient,
  } = {},
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const response = await fetchClient.fetch({
    context: { credsPayload },
    requestPayload: {
      method: 'get',
      url: '/me/player',
      params: {
        ...(market !== undefined && { market }),
        ...(additionalTypes !== undefined && {
          additional_types: Array.isArray(additionalTypes)
            ? additionalTypes.join(',')
            : additionalTypes,
        }),
      },
    },
  });

  // 204 = nothing currently playing / no active device
  if (response.ok && (response.data == null || response.data === '')) {
    return { ok: true, data: null };
  }

  const { ok, data, error } = response;
  if (!ok) {
    logDeep({ error });
    return { ok: false, error };
  }

  return { ok: true, data };
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  spotifyPlayerGet,
  funcApiConfig,
};
