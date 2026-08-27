// https://developer.spotify.com/documentation/web-api/reference/get-playlist

const { ArgsWarden, actionSingleOrMultiple, logDeep } = require('../utils');
const { credsValidator } = require('../validators');
const { spotifyClient } = require('../spotify/spotify.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['playlistId'],
]);

const spotifyPlaylistGetSingle = async (
  credsPayload,
  playlistId,
  {
    market,
    fields,
    additionalTypes,
    fetchClient = spotifyClient,
  } = {},
) => {
  const response = await fetchClient.fetch({
    context: { credsPayload },
    requestPayload: {
      method: 'get',
      url: `/playlists/${ playlistId }`,
      params: {
        ...(market !== undefined && { market }),
        ...(fields !== undefined && { fields }),
        ...(additionalTypes !== undefined && {
          additional_types: Array.isArray(additionalTypes)
            ? additionalTypes.join(',')
            : additionalTypes,
        }),
      },
    },
  });

  const { ok, data, error } = response;
  if (!ok) {
    logDeep({ error });
    return { ok: false, error };
  }

  return { ok: true, data };
};

const spotifyPlaylistGet = async (
  credsPayload,
  playlistId,
  {
    market,
    fields,
    additionalTypes,
    queueRunOptions,
    fetchClient,
  } = {},
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    playlistId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return actionSingleOrMultiple(
    playlistId,
    spotifyPlaylistGetSingle,
    (playlistIdItem) => ({
      args: [credsPayload, playlistIdItem, {
        market,
        fields,
        additionalTypes,
        fetchClient,
      }],
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  spotifyPlaylistGet,
  funcApiConfig,
};
