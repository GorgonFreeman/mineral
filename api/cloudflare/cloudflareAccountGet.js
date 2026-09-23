// https://developers.cloudflare.com/api/resources/accounts/methods/get/

const {
  ArgsWarden,
  credsFromPayload,
} = require('../utils');
const { credsValidator } = require('../validators');
const { cloudflareClient } = require('../cloudflare/cloudflare.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const cloudflareAccountGet = async (
  credsPayload,
  {
    accountId,
    inspect = false,
    fetchClient = cloudflareClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const creds = await credsFromPayload(credsPayload);
  const resolvedAccountId = accountId ?? creds.ACCOUNT_ID;

  if (!resolvedAccountId) {
    return {
      ok: false,
      error: {
        code: 'INVALID_CREDS',
        message: 'ACCOUNT_ID is required.',
      },
    };
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'get',
      url: `/accounts/${ resolvedAccountId }`,
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
  cloudflareAccountGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/cloudflareAccountGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "cloudflare" }
  }'
*/
