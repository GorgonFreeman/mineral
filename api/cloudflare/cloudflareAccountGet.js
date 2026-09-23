// https://developers.cloudflare.com/api/resources/accounts/methods/get/

const {
  ArgsWarden,
  appendUrlToBase,
  credsFromPayload,
  customFetch,
} = require('../utils');
const { credsValidator } = require('../validators');
const { BASE_URL } = require('../cloudflare/cloudflare.constants');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const cloudflareAccountGet = async (
  credsPayload,
  {
    accountId,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const creds = await credsFromPayload(credsPayload);
  const {
    API_TOKEN,
    ACCOUNT_ID,
  } = creds;
  const resolvedAccountId = accountId ?? ACCOUNT_ID;

  if (!API_TOKEN) {
    return {
      ok: false,
      error: {
        code: 'INVALID_CREDS',
        message: 'API_TOKEN is required.',
      },
    };
  }

  if (!resolvedAccountId) {
    return {
      ok: false,
      error: {
        code: 'INVALID_CREDS',
        message: 'ACCOUNT_ID is required (creds or options.accountId).',
      },
    };
  }

  const url = appendUrlToBase(BASE_URL, `/accounts/${ resolvedAccountId }`);

  const response = await customFetch(
    url,
    {
      method: 'get',
      headers: {
        Authorization: `Bearer ${ API_TOKEN }`,
      },
    },
  );

  if (!response.ok) {
    return response;
  }

  const {
    success,
    result,
    errors,
    messages,
  } = response.data ?? {};

  if (success === false) {
    return {
      ok: false,
      error: {
        code: 'CLOUDFLARE_API_ERROR',
        message: 'Cloudflare API returned success: false.',
        details: errors ?? response.data,
      },
    };
  }

  return {
    ok: true,
    data: result,
    ...(messages?.length && { meta: { messages } }),
  };
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
