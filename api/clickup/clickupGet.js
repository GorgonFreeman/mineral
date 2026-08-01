// https://developer.clickup.com/reference/getauthorizeduser

const { ArgsWarden, Getter } = require('../utils');
const { credsValidator } = require('../validators');
const { clickupClient } = require('../clickup/clickup.utils');
const { MAX_PER_PAGE } = require('../clickup/clickup.constants');

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

const clickupGetPacket = async (
  credsPayload,
  url,
  {
    params,
    perPage = MAX_PER_PAGE,
  } = {},
) => {
  return clickupClient.fetch({
    requestPayload: {
      url,
      params: {
        limit: Math.min(perPage, MAX_PER_PAGE),
        ...params,
        page: params?.page ?? 0,
      },
    },
    context: {
      credsPayload,
    },
  });
};

const clickupGetPaginator = async (currentParams, response) => {
  const { args, options } = currentParams;

  if (!response?.ok) {
    return [true];
  }

  if (response.data?.last_page !== false) {
    return [true];
  }

  const { params = {} } = options;
  const page = params.page ?? 0;

  return [false, {
    args,
    options: {
      ...options,
      params: {
        ...params,
        page: page + 1,
      },
    },
  }];
};

const clickupGet = async (
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
      func: clickupGetPacket,
      digester: (response) => {
        if (!response?.ok) {
          return [];
        }

        return digResults(response.data, resultsKey);
      },
      paginator: clickupGetPaginator,
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
  clickupGet: (...args) => clickupGet(false, ...args),
  clickupGetter: (...args) => clickupGet(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/clickupGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "clickup" },
    "url": "/team",
    "options": {
      "resultsKey": "teams"
    }
  }'
*/
