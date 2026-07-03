const { DEFAULT_API_VERSION } = require('../shopify/shopify.constants');
const { FetchClient, Chain, appendUrlToBase, fetchClientCommonSteps } = require('../utils');

const handleMutationUserErrors = async (state) => {
  const { response } = state;
  const mutationPayload = response?.data;

  if (!response?.ok || !mutationPayload || typeof mutationPayload !== 'object') {
    return {};
  }

  const { userErrors, ...mutationResult } = mutationPayload;

  if (!Array.isArray(userErrors)) {
    return {};
  }

  const primaryData = Object.values(mutationResult).find((value) => value != null);

  if (userErrors.length) {
    const message = userErrors
      .map((userError) => userError?.message)
      .filter(Boolean)
      .join('; ');

    return {
      response: {
        ok: false,
        error: {
          code: 'USER_ERROR',
          message: message || 'Mutation failed',
          details: userErrors,
        },
        ...(primaryData !== undefined ? { data: primaryData } : {}),
      },
      breakChain: true,
    };
  }

  const resultKeys = Object.keys(mutationResult).filter((key) => mutationResult[key] != null);

  if (resultKeys.length === 1) {
    return {
      response: {
        data: mutationResult[resultKeys[0]],
      },
    };
  }

  return {
    response: {
      data: mutationResult,
    },
  };
};

const addUrlAndAuthHeaders = async (state) => {
  const { requestPayload, context } = state;
  const {
    creds,
    apiVersion = DEFAULT_API_VERSION,
  } = context;
  const {
    STORE_HANDLE,
    API_KEY,
  } = creds;

  const baseUrl = `https://${ STORE_HANDLE }.myshopify.com/admin/api/${ apiVersion }/graphql.json`;
  const baseHeaders = {
    'X-Shopify-Access-Token': API_KEY,
  };

  return {
    requestPayload: {
      url: appendUrlToBase(baseUrl, requestPayload.url),
      headers: {
        ...baseHeaders,
        ...requestPayload.headers,
      },
    },
  };
};

const shopifyClientRequestPreparer = new Chain([
  addUrlAndAuthHeaders,
]);

const shopifyClientResponseInterpreter = new Chain([
  fetchClientCommonSteps.stripEdgesAndNodes,
  fetchClientCommonSteps.collapseDataWithOneValue,
  fetchClientCommonSteps.exitEarlyOnNotOk,
  fetchClientCommonSteps.exitEarlyOnGraphqlErrors,
  fetchClientCommonSteps.digToPath,
  handleMutationUserErrors,
]);

const shopifyClient = new FetchClient({
  requestPreparer: shopifyClientRequestPreparer,
  responseInterpreter: shopifyClientResponseInterpreter,
});

module.exports = {
  shopifyClient,
};