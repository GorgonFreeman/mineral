// https://developers.cloudflare.com/api/resources/dns/subresources/records/methods/get/

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { cloudflareClient } = require('../cloudflare/cloudflare.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['zoneId'],
  ['dnsRecordId'],
]);

const cloudflareDnsRecordGet = async (
  credsPayload,
  zoneId,
  dnsRecordId,
  {
    inspect = false,
    fetchClient = cloudflareClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    zoneId,
    dnsRecordId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'get',
      url: `/zones/${ zoneId }/dns_records/${ dnsRecordId }`,
    },
    context: {
      credsPayload,
      resultPath: 'result',
    },
    inspect,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  cloudflareDnsRecordGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/cloudflareDnsRecordGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "cloudflare" },
    "zoneId": "b7c2dcf34e09a7b17191040ae649e91a",
    "dnsRecordId": "76e69906c43d5f9e13fe961ca3312356"
  }'
*/
