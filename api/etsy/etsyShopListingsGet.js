// https://developers.etsy.com/documentation/reference/#operation/getListingsByShop

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyGet, etsyGetter } = require('./etsyGet');
const { resolveShopIdFromCreds } = require('./etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const etsyShopListingsGet = async (
  returnGetter,

  credsPayload,
  {
    shopId,
    state,
    sortOn,
    sortOrder,
    includes,
    legacy,
    params: paramsOption,
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

  const params = {
    ...paramsOption,
    ...(state && { state }),
    ...(sortOn && { sort_on: sortOn }),
    ...(sortOrder && { sort_order: sortOrder }),
    ...(includes && { includes }),
    ...(legacy !== undefined && { legacy }),
  };

  const getterArgs = [
    credsPayload,
    `/application/shops/${ shopId }/listings`,
    {
      params,
      perPage,
      ...getterOptions,
    },
  ];

  return returnGetter
    ? etsyGetter(...getterArgs)
    : etsyGet(...getterArgs);
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  etsyShopListingsGet: (...args) => etsyShopListingsGet(false, ...args),
  etsyShopListingsGetter: (...args) => etsyShopListingsGet(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/etsyShopListingsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "etsy" },
    "options": {
      "state": "active"
    }
  }'
*/
