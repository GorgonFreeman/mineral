// https://developers.printify.com/#retrieve-a-list-of-webhooks

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { printifyGet, printifyGetter } = require('../printify/printifyGet');
const { resolveShopIdFromCreds } = require('../printify/printify.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const printifyWebhooksGet = async (
  returnGetter,

  credsPayload,
  {
    shopId,
    ...getterOptions
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({ credsPayload });
  if (rejectResponse) {
    return rejectResponse;
  }

  const shopIdResponse = await resolveShopIdFromCreds({ shopId, credsPayload });
  if (!shopIdResponse.ok) {
    return shopIdResponse;
  }
  ({ data: shopId } = shopIdResponse);

  const getterArgs = [
    credsPayload,
    `/shops/${ shopId }/webhooks.json`,
    {
      ...getterOptions,
    },
  ];

  return returnGetter
    ? printifyGetter(...getterArgs)
    : printifyGet(...getterArgs);
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  printifyWebhooksGet: (...args) => printifyWebhooksGet(false, ...args),
  printifyWebhooksGetter: (...args) => printifyWebhooksGet(true, ...args),
  funcApiConfig,
};
