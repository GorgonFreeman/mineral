// https://developers.etsy.com/documentation/reference/#operation/getShopPaymentAccountLedgerEntries

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyGet, etsyGetter } = require('./etsyGet');
const { resolveShopId } = require('./etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const etsyShopPaymentAccountLedgerEntriesGet = async (
  returnGetter,

  credsPayload,
  {
    shopId,
    params: paramsOption,
    perPage,
    minCreated,
    maxCreated,
    withAccessToken = true,
    ...getterOptions
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const shopIdResponse = await resolveShopId({ shopId, credsPayload });
  if (!shopIdResponse.ok) {
    return shopIdResponse;
  }
  ({ data: shopId } = shopIdResponse);

  const params = {
    ...paramsOption,
    ...(minCreated !== undefined && { min_created: minCreated }),
    ...(maxCreated !== undefined && { max_created: maxCreated }),
  };

  const getterArgs = [
    credsPayload,
    `/application/shops/${ shopId }/payment-account/ledger-entries`,
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
  etsyShopPaymentAccountLedgerEntriesGet: (...args) => etsyShopPaymentAccountLedgerEntriesGet(false, ...args),
  etsyShopPaymentAccountLedgerEntriesGetter: (...args) => etsyShopPaymentAccountLedgerEntriesGet(true, ...args),
  funcApiConfig,
};
