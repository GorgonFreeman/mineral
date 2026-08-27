// https://developer.spotify.com/documentation/web-api/reference/change-playlist-details

const { ArgsWarden, logDeep } = require('../utils');
const { credsValidator } = require('../validators');
const { spotifyClient } = require('../spotify/spotify.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['playlistId'],
]);

const spotifyPlaylistUpdate = async (
  credsPayload,
  playlistId,
  {
    name,
    public: isPublic,
    collaborative,
    description,
    fetchClient = spotifyClient,
  } = {},
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    playlistId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const response = await fetchClient.fetch({
    context: { credsPayload },
    requestPayload: {
      method: 'put',
      url: `/playlists/${ playlistId }`,
      body: {
        ...(name !== undefined && { name }),
        ...(isPublic !== undefined && { public: isPublic }),
        ...(collaborative !== undefined && { collaborative }),
        ...(description !== undefined && { description }),
      },
    },
  });

  const { ok, data, error } = response;
  if (!ok) {
    logDeep({ error });
    return { ok: false, error };
  }

  return {
    ok: true,
    data: data ?? null,
  };
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  spotifyPlaylistUpdate,
  funcApiConfig,
};
