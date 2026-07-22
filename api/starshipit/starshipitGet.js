const { credsFromPayload, ArgsWarden, Getter } = require('../utils');
const { credsValidator } = require('../validators');
const { starshipitClient } = require('../starshipit/starshipit.utils');
const { MAX_PER_PAGE } = require('../starshipit/starshipit.constants');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['url'],
]);

const starshipitGetPacket = async (
  creds,
  url,
  {
    params,
    perPage = MAX_PER_PAGE,
  } = {},
) => {
  return starshipitClient.fetch({
    url,
    params: {
      page_size: perPage,
      page_number: 1,
      ...params,
    },
    context: {
      creds,
    },
  });
};

const starshipitGetPaginator = async (currentParams, response) => {
  if (!response?.ok) {
    return [true];
  }

  const {
    page_number: currentPage,
    page_size: pageSize,
    total_records: totalCount,
  } = response.data || {};

  if (!currentPage || !pageSize || !totalCount) {
    return [true];
  }

  const done = currentPage * pageSize >= totalCount;
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
        page_number: currentPage + 1,
      },
    },
  }];
};

const starshipitGet = async (
  returnGetter,

  credsPayload,
  url,
  {
    params,
    perPage = MAX_PER_PAGE,
    nodeName = 'results',
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
      func: starshipitGetPacket,
      digester: (response) => {
        if (!response?.ok) {
          firstError = response;
          return [];
        }

        return response?.data?.data?.[nodeName] ?? [];
      },
      paginator: starshipitGetPaginator,
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

  return {
    ok: true,
    data,
  };
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  starshipitGet: (...args) => starshipitGet(false, ...args),
  starshipitGetter: (...args) => starshipitGet(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/starshipitGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "starshipit.acc" },
    "url": "/products",
    "options": {
      "nodeName": "products",
      "limit": 10
    }
  }'
*/
