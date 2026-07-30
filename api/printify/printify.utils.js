const { BASE_URL } = require('../printify/printify.constants');
const { resolveCreds, useBaseUrl } = require('../pipelineSteps');
const { credsFromPayload, FetchClient, fetchClientCommonSteps } = require('../utils');

const resolveShopIdFromCreds = async ({
  shopId,
  credsPayload,
}) => {
  if (!shopId) {
    const creds = await credsFromPayload(credsPayload);
    shopId = creds.SHOP_ID;
  }

  if (!shopId) {
    return {
      ok: false,
      error: {
        code: 'INVALID_ARGS',
        message: 'shopId option is required if not in creds',
      },
    };
  }

  return {
    ok: true,
    data: shopId,
  };
};

const useAuthHeaders = async (state) => {
  const { requestPayload, context } = state;
  const { creds } = context;
  const { API_KEY } = creds;

  return {
    requestPayload: {
      ...requestPayload,
      headers: {
        Authorization: `Bearer ${ API_KEY }`,
        ...requestPayload.headers,
      },
    },
  };
};

const printifyClient = new FetchClient({
  pipeline: [
    resolveCreds,
    useAuthHeaders,
    useBaseUrl(BASE_URL),
    'fetch',
    fetchClientCommonSteps.exitEarlyOnNotOk,
  ],
});

module.exports = {
  printifyClient,
  resolveShopIdFromCreds,
};
