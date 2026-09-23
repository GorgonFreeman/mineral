// https://developers.cloudflare.com/api/resources/rulesets/methods/update/

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { cloudflareClient } = require('../cloudflare/cloudflare.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['zoneId'],
  ['rulesetId'],
  ['rulesetPayload', Boolean],
]);

const cloudflareZoneRulesetUpdate = async (
  credsPayload,
  zoneId,
  rulesetId,
  rulesetPayload,
  {
    inspect = false,
    fetchClient = cloudflareClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    zoneId,
    rulesetId,
    rulesetPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'put',
      url: `/zones/${ zoneId }/rulesets/${ rulesetId }`,
      body: rulesetPayload,
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
  cloudflareZoneRulesetUpdate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/cloudflareZoneRulesetUpdate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "cloudflare" },
    "zoneId": "b7c2dcf34e09a7b17191040ae649e91a",
    "rulesetId": "RULESET_ID",
    "rulesetPayload": {
      "rules": []
    }
  }'
*/
