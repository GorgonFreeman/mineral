const { ArgsWarden, Getter } = require('../utils');
const { credsValidator } = require('../validators');
const { gorgiasClient } = require('../gorgias/gorgias.utils');
const { MAX_PER_PAGE } = require('../gorgias/gorgias.constants');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['url'],
]);

const digResults = (data, resultsKey) => {
  if (resultsKey) {
    return data?.[resultsKey] ?? [];
  }

  if (Array.isArray(data)) {
    return data;
  }

  const arrayEntry = Object.entries(data || {}).find(([, value]) => Array.isArray(value));
  return arrayEntry ? arrayEntry[1] : [];
};

const gorgiasGetPacket = async (
  credsPayload,
  url,
  {
    params,
    perPage = MAX_PER_PAGE,
    fetchClient = gorgiasClient,
  } = {},
) => {
  return fetchClient.fetch({
    requestPayload: {
      url,
      params: {
        limit: Math.min(perPage, MAX_PER_PAGE),
        ...params,
      },
    },
    context: {
      credsPayload,
    },
  });
};

const gorgiasGetPaginator = async (currentParams, response) => {
  const { args, options } = currentParams;

  if (!response?.ok) {
    return [true];
  }

  const nextCursor = response?.data?.meta?.next_cursor;
  if (!nextCursor) {
    return [true];
  }

  const { params = {} } = options;

  return [false, {
    args,
    options: {
      ...options,
      params: {
        ...params,
        cursor: nextCursor,
      },
    },
  }];
};

const gorgiasGet = async (
  returnGetter,

  credsPayload,
  url,
  {
    params,
    perPage = MAX_PER_PAGE,
    resultsKey = 'data',
    fetchClient = gorgiasClient,
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
      func: gorgiasGetPacket,
      digester: (response) => {
        if (!response?.ok) {
          return [];
        }

        return digResults(response.data, resultsKey);
      },
      paginator: gorgiasGetPaginator,
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
  gorgiasGet: (...args) => gorgiasGet(false, ...args),
  gorgiasGetter: (...args) => gorgiasGet(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/gorgiasGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "gorgias" },
    "url": "/tickets",
    "options": {
      "limit": 10
    }
  }'
*/
