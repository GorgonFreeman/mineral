const { FIGMA_API_BASE_URL } = require('../figma/figma.constants');
const { resolveCreds, useBaseUrl } = require('../pipelineSteps');
const {
  FetchClient,
  fetchClientCommonSteps,
} = require('../utils');

const useAuthHeaders = async (state) => {
  const { requestPayload, context } = state;
  const { creds } = context;
  const {
    API_KEY,
    ACCESS_TOKEN,
  } = creds ?? {};

  // Personal / plan tokens (figd_...) must use X-Figma-Token.
  // Only non-figd ACCESS_TOKEN values are OAuth bearer tokens.
  const isFigdToken = (token) => typeof token === 'string'
    && token.startsWith('figd_');
  const authHeaders = ACCESS_TOKEN && !isFigdToken(ACCESS_TOKEN)
    ? {
      Authorization: `Bearer ${ ACCESS_TOKEN }`,
    }
    : {
      'X-Figma-Token': isFigdToken(ACCESS_TOKEN) ? ACCESS_TOKEN : API_KEY,
    };

  return {
    requestPayload: {
      ...requestPayload,
      headers: {
        ...authHeaders,
        ...requestPayload.headers,
      },
    },
  };
};

const figmaClient = new FetchClient({
  pipeline: [
    resolveCreds,
    useBaseUrl(FIGMA_API_BASE_URL),
    useAuthHeaders,
    'fetch',
    fetchClientCommonSteps.exitEarlyOnNotOk,
  ],
});

module.exports = {
  figmaClient,
};
