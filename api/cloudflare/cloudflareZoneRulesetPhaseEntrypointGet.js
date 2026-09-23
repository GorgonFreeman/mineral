// https://developers.cloudflare.com/api/resources/rulesets/subresources/phases/subresources/entrypoint/methods/get/

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { cloudflareClient } = require('../cloudflare/cloudflare.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['zoneId'],
  ['phase'],
]);

const cloudflareZoneRulesetPhaseEntrypointGet = async (
  credsPayload,
  zoneId,
  phase,
  {
    inspect = false,
    fetchClient = cloudflareClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    zoneId,
    phase,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'get',
      url: `/zones/${ zoneId }/rulesets/phases/${ phase }/entrypoint`,
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
  cloudflareZoneRulesetPhaseEntrypointGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/cloudflareZoneRulesetPhaseEntrypointGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "cloudflare" },
    "zoneId": "b7c2dcf34e09a7b17191040ae649e91a",
    "phase": "http_request_dynamic_redirect"
  }'
*/
