// https://developer.spotify.com/documentation/web-api/reference/save-tracks-user

const { ArgsWarden, logDeep } = require('../utils');
const { credsValidator } = require('../validators');
const { spotifyClient } = require('../spotify/spotify.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['ids'],
]);

const spotifySavedTracksSave = async (
  credsPayload,
  ids,
  {
    fetchClient = spotifyClient,
  } = {},
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    ids,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const idList = Array.isArray(ids) ? ids : [ids];

  const response = await fetchClient.fetch({
    context: { credsPayload },
    requestPayload: {
      method: 'put',
      url: '/me/tracks',
      params: {
        ids: idList.join(','),
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
  spotifySavedTracksSave,
  funcApiConfig,
};
