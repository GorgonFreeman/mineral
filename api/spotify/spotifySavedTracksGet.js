// https://developer.spotify.com/documentation/web-api/reference/get-users-saved-tracks

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { spotifyGet } = require('../spotify/spotifyGet');
const { MAX_PER_PAGE } = require('../spotify/spotify.constants');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const spotifySavedTracksGet = async (
  credsPayload,
  {
    market,
    perPage = MAX_PER_PAGE,
    fetchClient,
    ...getterOptions
  } = {},
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return spotifyGet(credsPayload, '/me/tracks', {
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
  spotifySavedTracksGet,
  funcApiConfig,
};
