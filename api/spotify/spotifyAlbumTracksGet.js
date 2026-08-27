// https://developer.spotify.com/documentation/web-api/reference/get-an-albums-tracks

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { spotifyGet } = require('../spotify/spotifyGet');
const { MAX_PER_PAGE } = require('../spotify/spotify.constants');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['albumId'],
]);

const spotifyAlbumTracksGet = async (
  credsPayload,
  albumId,
  {
    market,
    perPage = MAX_PER_PAGE,
    fetchClient,
    ...getterOptions
  } = {},
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    albumId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return spotifyGet(credsPayload, `/albums/${ albumId }/tracks`, {
    params: {
      ...(market !== undefined && { market }),
    },
    perPage,
    resultsKey: 'items',
    fetchClient,
    ...getterOptions,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  spotifyAlbumTracksGet,
  funcApiConfig,
};
