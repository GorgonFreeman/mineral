// https://developer.spotify.com/documentation/web-api/reference/get-track

const { ArgsWarden, actionSingleOrMultiple, logDeep } = require('../utils');
const { credsValidator } = require('../validators');
const { spotifyClient } = require('../spotify/spotify.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['trackId'],
]);

const spotifyTrackGetSingle = async (
  credsPayload,
  trackId,
  {
    market,
    fetchClient = spotifyClient,
  } = {},
) => {
  const response = await fetchClient.fetch({
    context: { credsPayload },
    requestPayload: {
      method: 'get',
      url: `/tracks/${ trackId }`,
      params: {
        ...(market !== undefined && { market }),
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

const spotifyTrackGet = async (
  credsPayload,
  trackId,
  {
    market,
    queueRunOptions,
    fetchClient,
  } = {},
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    trackId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return actionSingleOrMultiple(
    trackId,
    spotifyTrackGetSingle,
    (trackIdItem) => ({
      args: [credsPayload, trackIdItem, { market, fetchClient }],
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  spotifyTrackGet,
  funcApiConfig,
};
