// https://developer.spotify.com/documentation/web-api/reference/search

const { ArgsWarden, Getter } = require('../utils');
const { credsValidator } = require('../validators');
const { spotifyClient } = require('../spotify/spotify.utils');
const { MAX_SEARCH_PER_PAGE } = require('../spotify/spotify.constants');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['query'],
  ['types'],
]);

const digSearchResults = (data, types) => {
  const typeList = (Array.isArray(types) ? types : String(types).split(','))
    .map((t) => t.trim())
    .filter(Boolean);

  // Flatten matches across requested types, tagging each with its type key.
  const out = [];
  for (const type of typeList) {
    const key = type.endsWith('s') ? type : `${ type }s`;
    const page = data?.[key];
    const items = page?.items ?? [];
    for (const item of items) {
      out.push({ type: key, ...item });
    }
  }
  return out;
};

const spotifySearchPacket = async (
  credsPayload,
  query,
  types,
  {
    params = {},
    perPage = MAX_SEARCH_PER_PAGE,
    fetchClient = spotifyClient,
  } = {},
) => {
  const typeParam = Array.isArray(types) ? types.join(',') : types;

  return fetchClient.fetch({
    context: { credsPayload },
    requestPayload: {
      method: 'get',
      url: '/search',
      params: {
        q: query,
        type: typeParam,
        limit: Math.min(perPage, MAX_SEARCH_PER_PAGE),
        offset: 0,
        ...params,
      },
    },
  });
};

const spotifySearchPaginator = async (currentParams, response) => {
  if (!response?.ok) {
    return [true];
  }

  const data = response.data ?? {};
  // Any requested type still having a next URL means we continue.
  const hasNext = Object.values(data).some(
    (page) => page && typeof page === 'object' && page.next,
  );
  if (!hasNext) {
    return [true];
  }

  const { args, options } = currentParams;
  const { params = {}, perPage = MAX_SEARCH_PER_PAGE } = options;
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

const spotifySearch = async (
  returnGetter,

  credsPayload,
  query,
  types,
  {
    market,
    includeExternal,
    perPage = MAX_SEARCH_PER_PAGE,
    fetchClient,
    ...getterOptions
  } = {},
) => {
  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    query,
    types,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const typeList = Array.isArray(types) ? types : String(types).split(',');

  const getter = new Getter(
    {
      args: [credsPayload, query, types],
      options: {
        params: {
          ...(market !== undefined && { market }),
          ...(includeExternal !== undefined && {
            include_external: includeExternal,
          }),
        },
        perPage,
        fetchClient,
      },
    },
    {
      func: spotifySearchPacket,
      digester: (response) => {
        if (!response?.ok) {
          return [];
        }
        return digSearchResults(response.data, typeList);
      },
      paginator: spotifySearchPaginator,
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
  spotifySearch: (...args) => spotifySearch(false, ...args),
  spotifySearchGetter: (...args) => spotifySearch(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/spotifySearch" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "spotify" },
    "query": "radiohead",
    "types": ["artist", "album"]
  }'
*/
