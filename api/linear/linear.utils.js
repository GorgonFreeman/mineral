const { LINEAR_GRAPHQL_URL } = require('../linear/linear.constants');
const { resolveCreds } = require('../pipelineSteps');
const {
  FetchClient,
  fetchClientCommonSteps,
  pathAsArray,
  objectDigNodeAtPath,
} = require('../utils');

const useAuthHeaders = async (state) => {
  const { requestPayload, context } = state;
  const { creds } = context;
  const { API_KEY } = creds;

  return {
    requestPayload: {
      ...requestPayload,
      url: requestPayload.url || LINEAR_GRAPHQL_URL,
      method: requestPayload.method || 'post',
      headers: {
        Authorization: API_KEY,
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

const linearClient = new FetchClient({
  pipeline: [
    resolveCreds,
    useAuthHeaders,
    'fetch',
    movePageInfoToMeta,
    fetchClientCommonSteps.stripEdgesAndNodes,
    fetchClientCommonSteps.exitEarlyOnNotOk,
    fetchClientCommonSteps.exitEarlyOnGraphqlErrors,
    fetchClientCommonSteps.digToPath,
  ],
});

const linearConnectionDigester = (response) => {
  if (!response?.ok) {
    return [];
  }

  return response?.data ?? [];
};

const linearConnectionPaginator = async (currentParams, response) => {
  const { args, options } = currentParams;

  if (!response?.ok) {
    return [true];
  }

  const pageInfo = response?.meta?.pageInfo;
  if (!pageInfo?.hasNextPage || !pageInfo?.endCursor) {
    return [true];
  }

  return [false, {
    args,
    options: {
      ...options,
      after: pageInfo.endCursor,
    },
  }];
};

module.exports = {
  linearClient,
  linearConnectionDigester,
  linearConnectionPaginator,
};
