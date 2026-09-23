// https://developers.cloudflare.com/api/resources/rulesets/methods/create/

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { cloudflareClient } = require('../cloudflare/cloudflare.utils');

const rulesetPayloadValidator = (rulesetPayload) => (
  Boolean(rulesetPayload?.name && rulesetPayload?.kind && rulesetPayload?.phase)
);

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['zoneId'],
  ['rulesetPayload', rulesetPayloadValidator],
]);

const cloudflareZoneRulesetCreate = async (
  credsPayload,
  zoneId,
  rulesetPayload,
  {
    inspect = false,
    fetchClient = cloudflareClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    zoneId,
    rulesetPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'post',
      url: `/zones/${ zoneId }/rulesets`,
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
  cloudflareZoneRulesetCreate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/cloudflareZoneRulesetCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "cloudflare" },
    "zoneId": "b7c2dcf34e09a7b17191040ae649e91a",
    "rulesetPayload": {
      "name": "Redirect rules ruleset",
      "kind": "zone",
      "phase": "http_request_dynamic_redirect",
      "rules": []
    }
  }'
*/
