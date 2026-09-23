// https://developers.cloudflare.com/api/resources/rulesets/subresources/rules/methods/update/

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { cloudflareClient } = require('../cloudflare/cloudflare.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['zoneId'],
  ['rulesetId'],
  ['ruleId'],
  ['rulePayload', Boolean],
]);

const cloudflareZoneRulesetRuleUpdate = async (
  credsPayload,
  zoneId,
  rulesetId,
  ruleId,
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
    ruleId,
    rulePayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'PATCH',
      url: `/zones/${ zoneId }/rulesets/${ rulesetId }/rules/${ ruleId }`,
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
  cloudflareZoneRulesetRuleUpdate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/cloudflareZoneRulesetRuleUpdate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "cloudflare" },
    "zoneId": "b7c2dcf34e09a7b17191040ae649e91a",
    "rulesetId": "RULESET_ID",
    "ruleId": "RULE_ID",
    "rulePayload": {
      "action_parameters": {
        "from_value": {
          "target_url": { "value": "https://example.com/updated" },
          "status_code": 302
        }
      }
    }
  }'
*/
