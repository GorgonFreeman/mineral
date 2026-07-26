const {
  BASE_URL,
  DEFAULT_API_VERSION,
  DEFAULT_USER_AGENT,
} = require('../github/github.constants');
const { resolveCreds } = require('../pipelineSteps');
const {
  FetchClient,
  appendUrlToBase,
  fetchClientCommonSteps,
} = require('../utils');

const useGithubUrl = async (state) => {
  const { requestPayload, context } = state;
  const { creds } = context;
  const baseUrl = creds?.BASE_URL ?? BASE_URL;

  return {
    requestPayload: {
      ...requestPayload,
      url: appendUrlToBase(baseUrl, requestPayload.url),
    },
  };
};

const useAuthHeaders = async (state) => {
  const { requestPayload, context } = state;
  const { creds } = context;
  const {
    ACCESS_TOKEN,
    GITHUB_TOKEN,
    API_VERSION,
    USER_AGENT,
  } = creds ?? {};
  const token = ACCESS_TOKEN ?? GITHUB_TOKEN;
  const apiVersion = API_VERSION ?? context.apiVersion ?? DEFAULT_API_VERSION;
  const userAgent = USER_AGENT ?? DEFAULT_USER_AGENT;

  return {
    requestPayload: {
      ...requestPayload,
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': apiVersion,
        Authorization: `Bearer ${ token }`,
        'User-Agent': userAgent,
        ...requestPayload.headers,
      },
    },
  };
};

const githubClient = new FetchClient({
  pipeline: [
    resolveCreds,
    useGithubUrl,
    useAuthHeaders,
    'fetch',
    fetchClientCommonSteps.exitEarlyOnNotOk,
  ],
});

module.exports = {
  githubClient,
};
