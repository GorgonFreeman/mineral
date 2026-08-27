// https://developer.spotify.com/documentation/web-api/reference/create-playlist

const { ArgsWarden, logDeep } = require('../utils');
const { credsValidator } = require('../validators');
const { spotifyClient } = require('../spotify/spotify.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['userId'],
  ['name'],
]);

const spotifyPlaylistCreate = async (
  credsPayload,
  userId,
  name,
  {
    public: isPublic = true,
    collaborative = false,
    description,
    fetchClient = spotifyClient,
  } = {},
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    userId,
    name,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const response = await fetchClient.fetch({
    context: { credsPayload },
    requestPayload: {
      method: 'post',
      url: `/users/${ userId }/playlists`,
      body: {
        name,
        public: isPublic,
        collaborative,
        ...(description !== undefined && { description }),
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
  spotifyPlaylistCreate,
  funcApiConfig,
};
