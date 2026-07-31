// https://developers.etsy.com/documentation/reference/#operation/findShops

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyGet, etsyGetter } = require('./etsyGet');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const etsyShopsGet = async (
  returnGetter,

  credsPayload,
  {
    params: paramsOption,
    perPage,
    shopName,
    withAccessToken = false,
    ...getterOptions
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const params = {
    ...paramsOption,
    ...(shopName !== undefined && { shop_name: shopName }),
  };

  const getterArgs = [
    credsPayload,
    `/application/shops`,
    {
      params,
      perPage,
      withAccessToken,
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
  etsyShopsGet: (...args) => etsyShopsGet(false, ...args),
  etsyShopsGetter: (...args) => etsyShopsGet(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/etsyShopsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": {
      "credsPath": "etsy"
    }
  }'
*/
