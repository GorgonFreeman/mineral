// https://developer.spotify.com/documentation/web-api/reference/get-a-list-of-current-users-playlists

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { spotifyGet } = require('../spotify/spotifyGet');
const { MAX_PER_PAGE } = require('../spotify/spotify.constants');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const spotifyPlaylistsGet = async (
  credsPayload,
  {
    userId,
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

  const url = userId
    ? `/users/${ userId }/playlists`
    : '/me/playlists';

  return spotifyGet(credsPayload, url, {
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
  spotifyPlaylistsGet,
  funcApiConfig,
};
