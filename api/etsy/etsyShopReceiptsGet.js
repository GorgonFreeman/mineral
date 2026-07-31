// https://developers.etsy.com/documentation/reference/#operation/getShopReceipts

const { ArgsWarden, Getter } = require('../utils');
const { credsValidator } = require('../validators');
const { MAX_PER_PAGE } = require('./etsy.constants');
const { etsyClient, resolveShopIdFromCreds } = require('./etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const etsyShopReceiptsGetPacket = async (
  credsPayload,
  shopId,
  {
    params,
    perPage = MAX_PER_PAGE,
  } = {},
) => {
  return etsyClient.fetch({
    requestPayload: {
      method: 'get',
      url: `/application/shops/${ shopId }/receipts`,
      params: {
        limit: perPage,
        ...params,
      },
    },
    context: {
      credsPayload,
      withAccessToken: true,
    },
  });
};

const etsyShopReceiptsGetPaginator = async (currentParams, response) => {
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

const etsyShopReceiptsGetDigester = (response) => {
  if (!response?.ok) {
    return [];
  }

  return response.data?.results ?? [];
};

const etsyShopReceiptsGet = async (
  returnGetter,

  credsPayload,
  {
    shopId,
    params,
    perPage,
    ...getterOptions
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const shopIdResponse = await resolveShopIdFromCreds({ shopId, credsPayload });
  if (!shopIdResponse.ok) {
    return shopIdResponse;
  }
  ({ data: shopId } = shopIdResponse);

  const getter = new Getter(
    {
      args: [credsPayload, shopId],
      options: {
        params,
        perPage,
      },
    },
    {
      func: etsyShopReceiptsGetPacket,
      digester: etsyShopReceiptsGetDigester,
      paginator: etsyShopReceiptsGetPaginator,
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
  etsyShopReceiptsGet: (...args) => etsyShopReceiptsGet(false, ...args),
  etsyShopReceiptsGetter: (...args) => etsyShopReceiptsGet(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/etsyShopReceiptsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "etsy" }
  }'
*/
