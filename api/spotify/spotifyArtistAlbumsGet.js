// https://developer.spotify.com/documentation/web-api/reference/get-an-artists-albums

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { spotifyGet } = require('../spotify/spotifyGet');
const { MAX_PER_PAGE } = require('../spotify/spotify.constants');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['artistId'],
]);

const spotifyArtistAlbumsGet = async (
  credsPayload,
  artistId,
  {
    includeGroups,
    market,
    perPage = MAX_PER_PAGE,
    fetchClient,
    ...getterOptions
  } = {},
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    artistId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return spotifyGet(credsPayload, `/artists/${ artistId }/albums`, {
    params: {
      ...(includeGroups !== undefined && {
        include_groups: Array.isArray(includeGroups)
          ? includeGroups.join(',')
          : includeGroups,
      }),
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
  spotifyArtistAlbumsGet,
  funcApiConfig,
};
