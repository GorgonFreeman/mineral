// https://developer.spotify.com/documentation/web-api/reference/get-an-album

const { ArgsWarden, actionSingleOrMultiple, logDeep } = require('../utils');
const { credsValidator } = require('../validators');
const { spotifyClient } = require('../spotify/spotify.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['albumId'],
]);

const spotifyAlbumGetSingle = async (
  credsPayload,
  albumId,
  {
    market,
    fetchClient = spotifyClient,
  } = {},
) => {
  const response = await fetchClient.fetch({
    context: { credsPayload },
    requestPayload: {
      method: 'get',
      url: `/albums/${ albumId }`,
      params: {
        ...(market !== undefined && { market }),
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

const spotifyAlbumGet = async (
  credsPayload,
  albumId,
  {
    market,
    queueRunOptions,
    fetchClient,
  } = {},
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    albumId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return actionSingleOrMultiple(
    albumId,
    spotifyAlbumGetSingle,
    (albumIdItem) => ({
      args: [credsPayload, albumIdItem, { market, fetchClient }],
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
  spotifyAlbumGet,
  funcApiConfig,
};
