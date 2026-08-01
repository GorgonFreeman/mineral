// https://developers.telnyx.com/api

const { ArgsWarden, Getter } = require('../utils');
const { credsValidator } = require('../validators');
const { telnyxClient } = require('../telnyx/telnyx.utils');
const { MAX_PER_PAGE } = require('../telnyx/telnyx.constants');

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

const telnyxGetPacket = async (
  credsPayload,
  url,
  {
    params,
    perPage = MAX_PER_PAGE,
  } = {},
) => {
  return telnyxClient.fetch({
    requestPayload: {
      url,
      params: {
        'page[size]': Math.min(perPage, MAX_PER_PAGE),
        ...params,
      },
    },
    context: {
      credsPayload,
    },
  });
};

const telnyxGetPaginator = async (currentParams, response) => {
  const { args, options } = currentParams;

  if (!response?.ok) {
    return [true];
  }

  const nextPage = response?.data?.meta?.page_number;
  const totalPages = response?.data?.meta?.total_pages;
  if (!nextPage || !totalPages || nextPage >= totalPages) {
    return [true];
  }

  const { params = {} } = options;

  return [false, {
    args,
    options: {
      ...options,
      params: {
        ...params,
        'page[number]': nextPage + 1,
      },
    },
  }];
};

const telnyxGet = async (
  returnGetter,

  credsPayload,
  url,
  {
    params,
    perPage = MAX_PER_PAGE,
    resultsKey = 'data',
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
      func: telnyxGetPacket,
      digester: (response) => {
        if (!response?.ok) {
          return [];
        }

        return digResults(response.data, resultsKey);
      },
      paginator: telnyxGetPaginator,
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
  telnyxGet: (...args) => telnyxGet(false, ...args),
  telnyxGetter: (...args) => telnyxGet(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/telnyxGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "telnyx" },
    "url": "/phone_numbers",
    "options": {
      "resultsKey": "data",
      "limit": 5
    }
  }'
*/
