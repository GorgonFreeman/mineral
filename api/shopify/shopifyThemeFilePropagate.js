const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');

const argsWarden = new ArgsWarden([
  ['fromCredsPayload', credsValidator],
  ['toCredsPayload', credsValidator],
  ['fromThemeId'],
  ['toThemeId'],
  ['filepath'],
]);

const shopifyThemeFilePropagate = async (
  fromCredsPayload,
  toCredsPayload,
  fromThemeId,
  toThemeId,
  filepath,
  options = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    fromCredsPayload,
    toCredsPayload,
    fromThemeId,
    toThemeId,
    filepath,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return {
    ok: true,
    data: {
      fromCredsPayload,
      toCredsPayload,
      fromThemeId,
      toThemeId,
      filepath,
      options,
    },
  };
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyThemeFilePropagate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyThemeFilePropagate" \
  -H "Content-Type: application/json" \
  -d '{
    "fromCredsPayload": { "credsPath": "shopify.au" },
    "toCredsPayload": { "credsPath": "shopify.au" },
    "fromThemeId": "1234",
    "toThemeId": "1234",
    "filepath": "sections/product.json"
  }'
*/
