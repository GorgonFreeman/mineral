// https://developers.printify.com/#retrieve-a-list-of-products

const { ArgsWarden, credsFromPayload } = require('../utils');
const { credsValidator } = require('../validators');
const { printifyGet, printifyGetter } = require('../printify/printifyGet');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const printifyThingsGet = async (
  returnGetter,

  credsPayload,
  {
    shopId,
    ...getterOptions
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  if (!shopId) {
    const creds = await credsFromPayload(credsPayload);
    ({ SHOP_ID: shopId } = creds);
  }

  if (!shopId) {
    return {
      ok: false,
      error: {
        code: 'INVALID_ARGS',
        message: 'shopId option is required if not in creds',
      },
    };
  }

  const getterArgs = [
    credsPayload,
    `/shops/${ shopId }/products.json`,
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
  printifyThingsGet: (...args) => printifyThingsGet(false, ...args),
  printifyThingsGetter: (...args) => printifyThingsGet(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/printifyThingsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "printify" },
    "options": {
      "limit": 10
    }
  }'
*/
