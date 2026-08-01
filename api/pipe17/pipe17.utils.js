const {
  PIPE17_API_BASE_URL,
} = require('../pipe17/pipe17.constants');
const { resolveCreds, useBaseUrl } = require('../pipelineSteps');
const {
  FetchClient,
  fetchClientCommonSteps,
} = require('../utils');

const usePipe17BaseUrl = async (state) => {
  const { creds } = state.context;
  return useBaseUrl(creds.BASE_URL ?? PIPE17_API_BASE_URL)(state);
};

const useAuthHeaders = async (state) => {
  const { requestPayload, context } = state;
  const { creds } = context;
  const { API_KEY } = creds;

  if (!API_KEY) {
    return {
      breakChain: true,
      response: {
        ok: false,
        error: {
          code: 'INVALID_CREDS',
          message: 'API_KEY is required.',
        },
      },
    };
  }

  return {
    requestPayload: {
      ...requestPayload,
      headers: {
        'X-Pipe17-Key': API_KEY,
        Accept: 'application/json',
        ...requestPayload.headers,
      },
    },
  };
};

const interpretPipe17Response = async (state) => {
  const { response } = state;

  if (!response?.ok) {
    return {};
  }

  const { success, result, errors } = response.data || {};

  if (success === false) {
    return {
      response: {
        ok: false,
        error: {
          code: 'PIPE17_API_ERROR',
          details: result ?? errors ?? response.data,
        },
      },
      breakChain: true,
    };
  }

  return {};
};

const pipe17Client = new FetchClient({
  pipeline: [
    resolveCreds,
    usePipe17BaseUrl,
    useAuthHeaders,
    'fetch',
    fetchClientCommonSteps.exitEarlyOnNotOk,
    interpretPipe17Response,
  ],
});

const pipe17GetSingle = async (
  credsPayload,
  collectionPath,
  id,
  {
    resultKey,
    inspect = false,
    fetchClient = pipe17Client,
  } = {},
) => {

  const response = await fetchClient.fetch({
    requestPayload: {
      method: 'get',
      url: `${ collectionPath }/${ id }`,
    },
    context: { credsPayload },
    inspect,
  });

  if (!response.ok) {
    return response;
  }

  const resolvedResultKey = resultKey ?? collectionPath.replace(/^\//, '').replace(/s$/, '');
  const entity = response.data?.result?.[resolvedResultKey]
    ?? response.data?.[resolvedResultKey];

  if (entity !== undefined) {
    return {
      ...response,
      data: entity,
    };
  }

  return response;
};

module.exports = {
  pipe17Client,
  interpretPipe17Response,
  pipe17GetSingle,
};
