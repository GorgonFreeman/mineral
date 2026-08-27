// https://developer.spotify.com/documentation/web-api/reference/get-playlists-items
// (formerly /tracks; renamed to /items)

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { spotifyGet } = require('../spotify/spotifyGet');
const { MAX_PER_PAGE } = require('../spotify/spotify.constants');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['playlistId'],
]);

const spotifyPlaylistItemsGet = async (
  credsPayload,
  playlistId,
  {
    market,
    fields,
    additionalTypes,
    perPage = MAX_PER_PAGE,
    fetchClient,
    ...getterOptions
  } = {},
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    playlistId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return spotifyGet(credsPayload, `/playlists/${ playlistId }/items`, {
    params: {
      ...(market !== undefined && { market }),
      ...(fields !== undefined && { fields }),
      ...(additionalTypes !== undefined && {
        additional_types: Array.isArray(additionalTypes)
          ? additionalTypes.join(',')
          : additionalTypes,
      }),
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
  spotifyPlaylistItemsGet,
  funcApiConfig,
};
