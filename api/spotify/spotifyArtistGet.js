// https://developer.spotify.com/documentation/web-api/reference/get-an-artist

const { ArgsWarden, actionSingleOrMultiple, logDeep } = require('../utils');
const { credsValidator } = require('../validators');
const { spotifyClient } = require('../spotify/spotify.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['artistId'],
]);

const spotifyArtistGetSingle = async (
  credsPayload,
  artistId,
  {
    fetchClient = spotifyClient,
  } = {},
) => {
  const response = await fetchClient.fetch({
    context: { credsPayload },
    requestPayload: {
      method: 'get',
      url: `/artists/${ artistId }`,
    },
  });

  const { ok, data, error } = response;
  if (!ok) {
    logDeep({ error });
    return { ok: false, error };
  }

  return { ok: true, data };
};

const spotifyArtistGet = async (
  credsPayload,
  artistId,
  {
    queueRunOptions,
    fetchClient,
  } = {},
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    artistId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return actionSingleOrMultiple(
    artistId,
    spotifyArtistGetSingle,
    (artistIdItem) => ({
      args: [credsPayload, artistIdItem, { fetchClient }],
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
  spotifyArtistGet,
  funcApiConfig,
};
