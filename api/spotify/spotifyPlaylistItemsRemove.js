// https://developer.spotify.com/documentation/web-api/reference/remove-playlist-items

const { ArgsWarden, logDeep } = require('../utils');
const { credsValidator } = require('../validators');
const { spotifyClient } = require('../spotify/spotify.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['playlistId'],
  ['tracks'],
]);

// tracks: array of { uri, positions? } or array of uri strings
const spotifyPlaylistItemsRemove = async (
  credsPayload,
  playlistId,
  tracks,
  {
    snapshotId,
    fetchClient = spotifyClient,
  } = {},
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    playlistId,
    tracks,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const trackList = (Array.isArray(tracks) ? tracks : [tracks]).map((entry) => {
    if (typeof entry === 'string') {
      return { uri: entry };
    }
    return entry;
  });

  const response = await fetchClient.fetch({
    context: { credsPayload },
    requestPayload: {
      method: 'delete',
      url: `/playlists/${ playlistId }/items`,
      body: {
        tracks: trackList,
        ...(snapshotId !== undefined && { snapshot_id: snapshotId }),
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
  spotifyPlaylistItemsRemove,
  funcApiConfig,
};
