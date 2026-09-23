// https://developers.cloudflare.com/api/resources/rulesets/subresources/rules/methods/create/

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { cloudflareClient } = require('../cloudflare/cloudflare.utils');

const rulePayloadValidator = (rulePayload) => (
  Boolean(rulePayload?.action && rulePayload?.expression)
);

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['zoneId'],
  ['rulesetId'],
  ['rulePayload', rulePayloadValidator],
]);

const cloudflareZoneRulesetRuleCreate = async (
  credsPayload,
  zoneId,
  rulesetId,
  rulePayload,
  {
    inspect = false,
    fetchClient = cloudflareClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    zoneId,
    rulesetId,
    rulePayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'post',
      url: `/zones/${ zoneId }/rulesets/${ rulesetId }/rules`,
      body: rulePayload,
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
  cloudflareZoneRulesetRuleCreate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/cloudflareZoneRulesetRuleCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "cloudflare" },
    "zoneId": "b7c2dcf34e09a7b17191040ae649e91a",
    "rulesetId": "RULESET_ID",
    "rulePayload": {
      "ref": "mineral_example",
      "expression": "true",
      "action": "redirect",
      "description": "Example redirect",
      "action_parameters": {
        "from_value": {
          "target_url": { "value": "https://example.com" },
          "status_code": 302
        }
      }
    }
  }'
*/
