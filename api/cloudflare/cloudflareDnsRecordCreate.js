// https://developers.cloudflare.com/api/resources/dns/subresources/records/methods/create/

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { cloudflareClient } = require('../cloudflare/cloudflare.utils');

const dnsRecordPayloadValidator = (dnsRecordPayload) => (
  Boolean(dnsRecordPayload?.type && dnsRecordPayload?.name)
);

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['zoneId'],
  ['dnsRecordPayload', dnsRecordPayloadValidator],
]);

const cloudflareDnsRecordCreate = async (
  credsPayload,
  zoneId,
  dnsRecordPayload,
  {
    inspect = false,
    fetchClient = cloudflareClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    zoneId,
    dnsRecordPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'post',
      url: `/zones/${ zoneId }/dns_records`,
      body: dnsRecordPayload,
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
  cloudflareDnsRecordCreate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/cloudflareDnsRecordCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "cloudflare" },
    "zoneId": "b7c2dcf34e09a7b17191040ae649e91a",
    "dnsRecordPayload": {
      "type": "CNAME",
      "name": "example.80788078.xyz",
      "content": "example.com",
      "proxied": true,
      "ttl": 1
    }
  }'
*/
