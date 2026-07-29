// https://developers.printify.com/#api-reference

const { ArgsWarden, credsFromPayload } = require('../utils');
const { credsValidator } = require('../validators');
const { printifyClient } = require('../printify/printify.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['arg'],
]);

const FUNC = async (
  credsPayload,
  arg,
  {
    shopId,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({ credsPayload, arg });
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

  return printifyClient.fetch({
    requestPayload: {
      method: 'get',
      url: `/shops/${ shopId }/things/${ arg }.json`,
    },
    context: { credsPayload },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  FUNC,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/FUNC" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "printify" },
    "arg": "1234"
  }'
*/
