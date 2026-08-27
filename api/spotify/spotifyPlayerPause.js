// https://developer.spotify.com/documentation/web-api/reference/pause-a-users-playback

const { ArgsWarden, logDeep } = require('../utils');
const { credsValidator } = require('../validators');
const { spotifyClient } = require('../spotify/spotify.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const spotifyPlayerPause = async (
  credsPayload,
  {
    deviceId,
    fetchClient = spotifyClient,
  } = {},
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const response = await fetchClient.fetch({
    context: { credsPayload },
    requestPayload: {
      method: 'put',
      url: '/me/player/pause',
      params: {
        ...(deviceId !== undefined && { device_id: deviceId }),
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
  spotifyPlayerPause,
  funcApiConfig,
};
