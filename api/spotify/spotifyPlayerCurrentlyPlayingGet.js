// https://developer.spotify.com/documentation/web-api/reference/get-the-users-currently-playing-track

const { ArgsWarden, logDeep } = require('../utils');
const { credsValidator } = require('../validators');
const { spotifyClient } = require('../spotify/spotify.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const spotifyPlayerCurrentlyPlayingGet = async (
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
      url: '/me/player/currently-playing',
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
  spotifyPlayerCurrentlyPlayingGet,
  funcApiConfig,
};
