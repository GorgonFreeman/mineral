// https://developer.spotify.com/documentation/web-api/reference/start-a-users-playback

const { ArgsWarden, logDeep } = require('../utils');
const { credsValidator } = require('../validators');
const { spotifyClient } = require('../spotify/spotify.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const spotifyPlayerPlay = async (
  credsPayload,
  {
    deviceId,
    contextUri,
    uris,
    offset,
    positionMs,
    fetchClient = spotifyClient,
  } = {},
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const body = {
    ...(contextUri !== undefined && { context_uri: contextUri }),
    ...(uris !== undefined && {
      uris: Array.isArray(uris) ? uris : [uris],
    }),
    ...(offset !== undefined && { offset }),
    ...(positionMs !== undefined && { position_ms: positionMs }),
  };

  const response = await fetchClient.fetch({
    context: { credsPayload },
    requestPayload: {
      method: 'put',
      url: '/me/player/play',
      params: {
        ...(deviceId !== undefined && { device_id: deviceId }),
      },
      // Spotify accepts empty body to resume.
      body: Object.keys(body).length ? body : {},
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
  spotifyPlayerPlay,
  funcApiConfig,
};
