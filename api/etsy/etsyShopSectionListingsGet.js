// https://developers.etsy.com/documentation/reference/#operation/getListingsByShopSectionId

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyGet, etsyGetter } = require('./etsyGet');
const { resolveShopId } = require('./etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['sectionId'],
]);

const etsyShopSectionListingsGet = async (
  returnGetter,

  credsPayload,
  sectionId,
  {
    shopId,
    params,
    perPage,
    ...getterOptions
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    sectionId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const shopIdResponse = await resolveShopId({ shopId, credsPayload });
  if (!shopIdResponse.ok) {
    return shopIdResponse;
  }
  ({ data: shopId } = shopIdResponse);

  const getterArgs = [
    credsPayload,
    `/application/shops/${ shopId }/sections/${ sectionId }/listings/active`,
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
  etsyShopSectionListingsGet: (...args) => etsyShopSectionListingsGet(false, ...args),
  etsyShopSectionListingsGetter: (...args) => etsyShopSectionListingsGet(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/etsyShopSectionListingsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "etsy" },
    "sectionId": "12345678"
  }'
*/
