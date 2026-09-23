// https://developers.cloudflare.com/api/resources/zones/methods/list/

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { cloudflareGet, cloudflareGetter } = require('../cloudflare/cloudflareGet');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const cloudflareZonesGet = async (
  returnGetter,

  credsPayload,
  {
    params,
    ...getterOptions
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const getterArgs = [
    credsPayload,
    '/zones',
    {
      params,
      ...getterOptions,
    },
  ];

  return returnGetter
    ? cloudflareGetter(...getterArgs)
    : cloudflareGet(...getterArgs);
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  cloudflareZonesGet: cloudflareZonesGet.bind(null, false),
  cloudflareZonesGetter: cloudflareZonesGet.bind(null, true),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/cloudflareZonesGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "cloudflare" },
    "options": {
      "limit": 5
    }
  }'
*/
