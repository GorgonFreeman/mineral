// https://developer.spotify.com/documentation/web-api/reference/add-items-to-playlist

const { ArgsWarden, logDeep } = require('../utils');
const { credsValidator } = require('../validators');
const { spotifyClient } = require('../spotify/spotify.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['playlistId'],
  ['uris'],
]);

const spotifyPlaylistItemsAdd = async (
  credsPayload,
  playlistId,
  uris,
  {
    position,
    fetchClient = spotifyClient,
  } = {},
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    playlistId,
    uris,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const uriList = Array.isArray(uris) ? uris : [uris];

  const response = await fetchClient.fetch({
    context: { credsPayload },
    requestPayload: {
      method: 'post',
      url: `/playlists/${ playlistId }/items`,
      body: {
        uris: uriList,
        ...(position !== undefined && { position }),
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

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  spotifyPlaylistItemsAdd,
  funcApiConfig,
};
