// https://developers.asana.com/reference/getuser

const { ArgsWarden, Getter } = require('../utils');
const { credsValidator } = require('../validators');
const { asanaClient } = require('../asana/asana.utils');
const { MAX_PER_PAGE } = require('../asana/asana.constants');

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

const asanaGetPacket = async (
  credsPayload,
  url,
  {
    params,
    perPage = MAX_PER_PAGE,
  } = {},
) => {
  return asanaClient.fetch({
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

const asanaGetPaginator = async (currentParams, response) => {
  const { args, options } = currentParams;

  if (!response?.ok) {
    return [true];
  }

  const nextPage = response?.data?.next_page;
  if (!nextPage?.offset) {
    return [true];
  }

  const { params = {} } = options;

  return [false, {
    args,
    options: {
      ...options,
      params: {
        ...params,
        offset: nextPage.offset,
      },
    },
  }];
};

const asanaGet = async (
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
      func: asanaGetPacket,
      digester: (response) => {
        if (!response?.ok) {
          return [];
        }

        if (Array.isArray(response.data?.data)) {
          return response.data.data;
        }

        return digResults(response.data, resultsKey);
      },
      paginator: asanaGetPaginator,
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
  asanaGet: (...args) => asanaGet(false, ...args),
  asanaGetter: (...args) => asanaGet(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/asanaGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "asana" },
    "url": "/users/me"
  }'
*/
