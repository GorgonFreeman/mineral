const { DEFAULT_API_VERSION } = require('../shopify/shopify.constants');
const { resolveCreds } = require('../pipelineSteps');
const {
  FetchClient,
  appendUrlToBase,
  fetchClientCommonSteps,
  pathAsArray,
  objectDigNodeAtPath,
} = require('../utils');

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
        ...(Object.keys(mutationResult).length ? { data: mutationResult } : {}),
      },
      breakChain: true,
    };
  }

  return {
    response: {
      data: mutationResult,
    },
  };
};

const useUrlAndAuthHeaders = async (state) => {
  const { requestPayload, context } = state;
  const {
    apiVersion = DEFAULT_API_VERSION,
    creds,
  } = context;
  const {
    STORE_HANDLE,
    API_KEY,
  } = creds;

  const baseUrl = `https://${ STORE_HANDLE }.myshopify.com/admin/api/${ apiVersion }/graphql.json`;

  return {
    requestPayload: {
      ...requestPayload,
      url: appendUrlToBase(baseUrl, requestPayload.url),
      headers: {
        'X-Shopify-Access-Token': API_KEY,
        ...requestPayload.headers,
      },
    },
  };
};

const movePageInfoToMeta = async (state) => {
  const { response, context } = state;
  const { resultPath } = context ?? {};

  if (!response?.ok || !response?.data || !resultPath) {
    return {};
  }

  const connection = objectDigNodeAtPath(response.data, pathAsArray(resultPath));

  if (!connection?.pageInfo) {
    return {};
  }

  return {
    response: {
      meta: {
        pageInfo: connection.pageInfo,
      },
    },
  };
};

const shopifyClient = new FetchClient({
  pipeline: [
    resolveCreds,
    useUrlAndAuthHeaders,
    'fetch',
    movePageInfoToMeta,
    fetchClientCommonSteps.stripEdgesAndNodes,
    fetchClientCommonSteps.collapseDataWithOneValue,
    fetchClientCommonSteps.exitEarlyOnNotOk,
    fetchClientCommonSteps.exitEarlyOnGraphqlErrors,
    fetchClientCommonSteps.digToPath,
    handleMutationUserErrors,
  ],
});

module.exports = {
  shopifyClient,
};
