const { ArgsWarden, Getter } = require('../utils');
const { credsValidator } = require('../validators');
const { MAX_PER_PAGE } = require('./etsy.constants');
const { etsyClient } = require('./etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['url'],
]);

const etsyGetPacket = async (
  credsPayload,
  url,
  {
    params,
    perPage = MAX_PER_PAGE,
    withAccessToken = true,
  } = {},
) => {
  return etsyClient.fetch({
    requestPayload: {
      method: 'get',
      url,
      params: {
        limit: perPage,
        ...params,
      },
    },
    context: {
      credsPayload,
      withAccessToken,
    },
  });
};

const etsyGetPaginator = async (currentParams, response) => {
  if (!response?.ok) {
    return [true];
  }

  const { count, results } = response.data ?? {};
  const itemsOnPage = Array.isArray(results) ? results.length : 0;

  if (count === undefined || !itemsOnPage) {
    return [true];
  }

  const { options } = currentParams;
  const offset = options?.params?.offset ?? 0;
  const nextOffset = offset + itemsOnPage;
  const done = nextOffset >= count;

  if (done) {
    return [true];
  }

  return [false, {
    ...currentParams,
    options: {
      ...options,
      params: {
        ...options.params,
        offset: nextOffset,
      },
    },
  }];
};

const etsyGetDigester = (response) => {
  if (!response?.ok) {
    return [];
  }

  return response.data?.results ?? [];
};

const etsyGet = async (
  returnGetter,

  credsPayload,
  url,
  {
    params,
    perPage = MAX_PER_PAGE,
    withAccessToken,
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
        withAccessToken,
      },
    },
    {
      func: etsyGetPacket,
      digester: etsyGetDigester,
      paginator: etsyGetPaginator,
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
  etsyGet: (...args) => etsyGet(false, ...args),
  etsyGetter: (...args) => etsyGet(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/etsyGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": {
      "credsPath": "etsy"
    },
    "url": "/application/shops/123456789/receipts"
  }'
*/
