const { ArgsWarden, Getter } = require('../utils');
const { credsValidator } = require('../validators');
const { printifyClient } = require('../printify/printify.utils');
const { MAX_PER_PAGE } = require('../printify/printify.constants');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['url'],
]);

const printifyGetPacket = async (
  credsPayload,
  url,
  {
    params,
    perPage = MAX_PER_PAGE,
  } = {},
) => {
  const {
    page = 1,
    ...restParams
  } = params ?? {};

  return printifyClient.fetch({
    requestPayload: {
      method: 'get',
      url,
      params: {
        page,
        limit: perPage,
        ...restParams,
      },
    },
    context: { credsPayload },
  });
};

const printifyGetPaginator = async (currentParams, response) => {
  if (!response?.ok) {
    return [true];
  }

  const body = response.data;
  const {
    current_page: currentPage,
    last_page: lastPage,
  } = body ?? {};

  if (!currentPage || !lastPage) {
    return [true];
  }

  const done = currentPage >= lastPage;
  if (done) {
    return [true];
  }

  const { args, options } = currentParams;

  return [false, {
    args,
    options: {
      ...options,
      params: {
        ...options.params,
        page: currentPage + 1,
      },
    },
  }];
};

const printifyGetDigester = (response) => {
  if (!response?.ok) {
    return [];
  }

  const body = response.data;

  if (Array.isArray(body)) {
    return body;
  }

  return body?.data ?? [];
};

const printifyGet = async (
  returnGetter,

  credsPayload,
  url,
  {
    params,
    perPage = MAX_PER_PAGE,
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
      func: printifyGetPacket,
      digester: printifyGetDigester,
      paginator: printifyGetPaginator,
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
  printifyGet: (...args) => printifyGet(false, ...args),
  printifyGetter: (...args) => printifyGet(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/printifyGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "printify" },
    "url": "/shops.json",
    "options": {
      "limit": 10
    }
  }'
*/
