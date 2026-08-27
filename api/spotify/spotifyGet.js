// https://developer.spotify.com/documentation/web-api/concepts/api-calls#pagination

const { ArgsWarden, Getter } = require('../utils');
const { credsValidator } = require('../validators');
const { spotifyClient } = require('../spotify/spotify.utils');
const { MAX_PER_PAGE } = require('../spotify/spotify.constants');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['url'],
]);

const digResults = (data, resultsKey) => {
  if (resultsKey) {
    // Nested e.g. tracks.items or playlists.items
    const value = resultsKey.split('.').reduce(
      (node, key) => node?.[key],
      data,
    );
    if (Array.isArray(value)) {
      return value;
    }
    return value != null ? [value] : [];
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data)) {
    return data;
  }

  return [];
};

const spotifyGetPacket = async (
  credsPayload,
  url,
  {
    params,
    perPage = MAX_PER_PAGE,
    fetchClient = spotifyClient,
  } = {},
) => {
  return fetchClient.fetch({
    requestPayload: {
      method: 'get',
      url,
      params: {
        limit: Math.min(perPage, MAX_PER_PAGE),
        offset: 0,
        ...params,
      },
    },
    context: {
      credsPayload,
    },
  });
};

const spotifyGetPaginator = async (currentParams, response) => {
  if (!response?.ok) {
    return [true];
  }

  const page = response.data ?? {};
  // Spotify paging objects expose next (URL) or offset/limit/total.
  if (page.next == null && page.items) {
    const { offset = 0, limit = 0, total = 0 } = page;
    if (offset + limit >= total || page.items.length === 0) {
      return [true];
    }
  } else if (!page.next) {
    return [true];
  }

  const { args, options } = currentParams;
  const { params = {}, perPage = MAX_PER_PAGE } = options;
  const currentOffset = Number(params.offset ?? 0);
  const pageLimit = Number(params.limit ?? perPage);

  return [false, {
    args,
    options: {
      ...options,
      params: {
        ...params,
        offset: currentOffset + pageLimit,
        limit: pageLimit,
      },
    },
  }];
};

const spotifyGet = async (
  returnGetter,

  credsPayload,
  url,
  {
    params,
    perPage = MAX_PER_PAGE,
    resultsKey = 'items',
    fetchClient,
    ...getterOptions
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    url,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const getter = new Getter(
    {
      args: [credsPayload, url],
      options: {
        params,
        perPage,
        fetchClient,
      },
    },
    {
      func: spotifyGetPacket,
      digester: (response) => {
        if (!response?.ok) {
          return [];
        }

        return digResults(response.data, resultsKey);
      },
      paginator: spotifyGetPaginator,
      ...getterOptions,
    },
  );

  if (returnGetter) {
    return getter;
  }

  const data = await getter.run({ returnAll: true });

  return {
    ok: true,
    data,
  };
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  spotifyGet: (...args) => spotifyGet(false, ...args),
  spotifyGetter: (...args) => spotifyGet(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/spotifyGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "spotify" },
    "url": "/me/playlists",
    "options": { "perPage": 20 }
  }'
*/
