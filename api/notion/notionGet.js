// https://developers.notion.com/reference/get-self

const { ArgsWarden, Getter } = require('../utils');
const { credsValidator } = require('../validators');
const { notionClient } = require('../notion/notion.utils');
const { MAX_PER_PAGE } = require('../notion/notion.constants');

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

const notionGetPacket = async (
  credsPayload,
  url,
  {
    params,
    perPage = MAX_PER_PAGE,
  } = {},
) => {
  return notionClient.fetch({
    requestPayload: {
      url,
      params: {
        page_size: Math.min(perPage, MAX_PER_PAGE),
        ...params,
      },
    },
    context: {
      credsPayload,
    },
  });
};

const notionGetPaginator = async (currentParams, response) => {
  const { args, options } = currentParams;

  if (!response?.ok) {
    return [true];
  }

  const nextCursor = response?.data?.next_cursor;
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
        start_cursor: nextCursor,
      },
    },
  }];
};

const notionGet = async (
  returnGetter,

  credsPayload,
  url,
  {
    params,
    perPage = MAX_PER_PAGE,
    resultsKey,
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
      },
    },
    {
      func: notionGetPacket,
      digester: (response) => {
        if (!response?.ok) {
          return [];
        }

        return digResults(response.data, resultsKey);
      },
      paginator: notionGetPaginator,
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
  notionGet: (...args) => notionGet(false, ...args),
  notionGetter: (...args) => notionGet(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/notionGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "notion" },
    "url": "/users/me"
  }'
*/
