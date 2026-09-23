// https://developers.cloudflare.com/api/resources/dns/subresources/records/methods/list/

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { cloudflareGet, cloudflareGetter } = require('../cloudflare/cloudflareGet');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['zoneId'],
]);

const cloudflareDnsRecordsGet = async (
  returnGetter,

  credsPayload,
  zoneId,
  {
    params,
    ...getterOptions
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    zoneId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const getterArgs = [
    credsPayload,
    `/zones/${ zoneId }/dns_records`,
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
  cloudflareDnsRecordsGet: cloudflareDnsRecordsGet.bind(null, false),
  cloudflareDnsRecordsGetter: cloudflareDnsRecordsGet.bind(null, true),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/cloudflareDnsRecordsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "cloudflare" },
    "zoneId": "b7c2dcf34e09a7b17191040ae649e91a",
    "options": {
      "limit": 5
    }
  }'
*/
