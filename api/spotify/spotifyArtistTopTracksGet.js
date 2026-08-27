// https://developer.spotify.com/documentation/web-api/reference/get-an-artists-top-tracks

const { ArgsWarden, logDeep } = require('../utils');
const { credsValidator } = require('../validators');
const { spotifyClient } = require('../spotify/spotify.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['artistId'],
]);

const spotifyArtistTopTracksGet = async (
  credsPayload,
  artistId,
  {
    market = 'US',
    fetchClient = spotifyClient,
  } = {},
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    artistId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const response = await fetchClient.fetch({
    context: { credsPayload },
    requestPayload: {
      method: 'get',
      url: `/artists/${ artistId }/top-tracks`,
      params: { market },
    },
  });

  const { ok, data, error } = response;
  if (!ok) {
    logDeep({ error });
    return { ok: false, error };
  }

  return {
    ok: true,
    data: data.tracks ?? data,
  };
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  spotifyArtistTopTracksGet,
  funcApiConfig,
};
