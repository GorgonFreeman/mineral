const { credsFromPayload, ArgsWarden, Getter } = require('../utils');
const { credsValidator } = require('../validators');
const { loopClient } = require('../loop/loop.utils');
const { MAX_PER_PAGE } = require('../loop/loop.constants');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['url'],
]);

const loopGetPacket = async (
  creds,
  url,
  {
    params,
    perPage = MAX_PER_PAGE,
    paginate = true,
  } = {},
) => {
  return loopClient.fetch({
    url,
    ...(paginate && {
      params: {
        paginate: true,
        pageSize: perPage,
        ...params,
      },
    }),
    context: {
      creds,
    },
  });
};

const loopGetPaginator = async (currentParams, response) => {
  const { args } = currentParams;

  if (!response?.ok) {
    return [true];
  }

  const nextPageUrl = response?.data?.nextPageUrl;
  if (!nextPageUrl) {
    return [true];
  }

  const [creds] = args;

  return [false, {
    args: [creds, nextPageUrl],
    options: {
      paginate: false,
    },
  }];
};

const loopGet = async (
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

  const creds = await credsFromPayload(credsPayload);

  let firstError = null;

  const getter = new Getter(
    {
      args: [creds, url],
      options: {
        params,
        perPage,
      },
    },
    {
      func: loopGetPacket,
      digester: (response) => {
        if (!response?.ok) {
          firstError = response;
          return [];
        }

        if (resultsKey) {
          return response?.data?.[resultsKey] ?? [];
        }

        return [];
      },
      paginator: loopGetPaginator,
      ...getterOptions,
    },
  );

  if (returnGetter) {
    return getter;
  }

  const data = await getter.run({ returnAll: true });

  if (firstError) {
    return firstError;
  }

  return data;
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  loopGet: (...args) => loopGet(false, ...args),
  loopGetter: (...args) => loopGet(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/loopGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "loop.au" },
    "url": "/warehouse/return/list",
    "options": {
      "resultsKey": "returns",
      "limit": 10
    }
  }'
*/
