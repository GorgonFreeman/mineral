// https://developers.cloudflare.com/rules/url-forwarding/single-redirects/create-api/

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { HTTP_REQUEST_DYNAMIC_REDIRECT_PHASE } = require('../cloudflare/cloudflare.constants');
const {
  cloudflareClient,
  isMissingRulesetPhaseEntrypoint,
  normaliseRedirectDomain,
  normaliseRedirectPath,
  buildRedirectRulePayload,
} = require('../cloudflare/cloudflare.utils');
const { cloudflareZonesGet } = require('../cloudflare/cloudflareZonesGet');
const { cloudflareZoneRulesetPhaseEntrypointGet } = require('../cloudflare/cloudflareZoneRulesetPhaseEntrypointGet');
const { cloudflareZoneRulesetCreate } = require('../cloudflare/cloudflareZoneRulesetCreate');
const { cloudflareZoneRulesetRuleCreate } = require('../cloudflare/cloudflareZoneRulesetRuleCreate');
const { cloudflareZoneRulesetRuleUpdate } = require('../cloudflare/cloudflareZoneRulesetRuleUpdate');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['fromDomain'],
  ['toUrl'],
]);

const findZoneByDomain = async (
  credsPayload,
  fromDomain,
  {
    inspect = false,
    fetchClient = cloudflareClient,
  } = {},
) => {
  const zonesResponse = await cloudflareZonesGet(
    credsPayload,
    {
      params: {
        name: fromDomain,
      },
      inspect,
      fetchClient,
    },
  );

  if (!zonesResponse.ok) {
    return zonesResponse;
  }

  const zone = (zonesResponse.data ?? []).find((entry) => entry?.name === fromDomain)
    ?? zonesResponse.data?.[0];

  if (!zone?.id) {
    return {
      ok: false,
      error: {
        code: 'ZONE_NOT_FOUND',
        message: `No Cloudflare zone found for domain ${ fromDomain }.`,
      },
    };
  }

  return {
    ok: true,
    data: zone,
  };
};

const findRuleByRef = (ruleset, ref) => (
  (ruleset?.rules ?? []).find((rule) => rule?.ref === ref)
);

const cloudflareRedirectUpsert = async (
  credsPayload,
  fromDomain,
  toUrl,
  {
    fromPath,
    statusCode = 302,
    preserveQueryString = true,
    description,
    enabled = true,
    inspect = false,
    fetchClient = cloudflareClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    fromDomain,
    toUrl,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const normalisedDomain = normaliseRedirectDomain(fromDomain);
  const normalisedPath = normaliseRedirectPath(fromPath);
  const rulePayload = buildRedirectRulePayload({
    fromDomain: normalisedDomain,
    fromPath: normalisedPath,
    toUrl,
    statusCode,
    preserveQueryString,
    description,
    enabled,
  });

  const zoneResponse = await findZoneByDomain(
    credsPayload,
    normalisedDomain,
    {
      inspect,
      fetchClient,
    },
  );
  if (!zoneResponse.ok) {
    return zoneResponse;
  }

  const zone = zoneResponse.data;
  const zoneId = zone.id;

  const entrypointResponse = await cloudflareZoneRulesetPhaseEntrypointGet(
    credsPayload,
    zoneId,
    HTTP_REQUEST_DYNAMIC_REDIRECT_PHASE,
    {
      inspect,
      fetchClient,
    },
  );

  if (!entrypointResponse.ok && !isMissingRulesetPhaseEntrypoint(entrypointResponse)) {
    return entrypointResponse;
  }

  if (isMissingRulesetPhaseEntrypoint(entrypointResponse)) {
    const createResponse = await cloudflareZoneRulesetCreate(
      credsPayload,
      zoneId,
      {
        name: 'Redirect rules ruleset',
        kind: 'zone',
        phase: HTTP_REQUEST_DYNAMIC_REDIRECT_PHASE,
        rules: [rulePayload],
      },
      {
        inspect,
        fetchClient,
      },
    );

    if (!createResponse.ok) {
      return createResponse;
    }

    return {
      ok: true,
      data: {
        action: 'created',
        zone,
        ruleset: createResponse.data,
        rule: findRuleByRef(createResponse.data, rulePayload.ref) ?? rulePayload,
      },
    };
  }

  const ruleset = entrypointResponse.data;
  const existingRule = findRuleByRef(ruleset, rulePayload.ref);

  if (existingRule?.id) {
    const updateResponse = await cloudflareZoneRulesetRuleUpdate(
      credsPayload,
      zoneId,
      ruleset.id,
      existingRule.id,
      rulePayload,
      {
        inspect,
        fetchClient,
      },
    );

    if (!updateResponse.ok) {
      return updateResponse;
    }

    return {
      ok: true,
      data: {
        action: 'updated',
        zone,
        ruleset: updateResponse.data,
        rule: findRuleByRef(updateResponse.data, rulePayload.ref)
          ?? existingRule,
      },
    };
  }

  const createRuleResponse = await cloudflareZoneRulesetRuleCreate(
    credsPayload,
    zoneId,
    ruleset.id,
    rulePayload,
    {
      inspect,
      fetchClient,
    },
  );

  if (!createRuleResponse.ok) {
    return createRuleResponse;
  }

  return {
    ok: true,
    data: {
      action: 'created',
      zone,
      ruleset: createRuleResponse.data,
      rule: findRuleByRef(createRuleResponse.data, rulePayload.ref) ?? rulePayload,
    },
  };
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  cloudflareRedirectUpsert,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/cloudflareRedirectUpsert" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "cloudflare" },
    "fromDomain": "80788078.xyz",
    "toUrl": "https://whitefoxboutique.com.au/pages/bestie-bonus",
    "options": {
      "statusCode": 302
    }
  }'
*/
