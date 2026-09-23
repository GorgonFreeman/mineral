const { BASE_URL } = require('../cloudflare/cloudflare.constants');
const { resolveCreds, useBaseUrl } = require('../pipelineSteps');
const {
  FetchClient,
  fetchClientCommonSteps,
} = require('../utils');

const useAuthHeaders = async (state) => {
  const { requestPayload, context } = state;
  const { creds } = context;
  const { API_TOKEN } = creds;

  if (!API_TOKEN) {
    return {
      breakChain: true,
      response: {
        ok: false,
        error: {
          code: 'INVALID_CREDS',
          message: 'API_TOKEN is required.',
        },
      },
    };
  }

  return {
    requestPayload: {
      ...requestPayload,
      headers: {
        Authorization: `Bearer ${ API_TOKEN }`,
        ...requestPayload.headers,
      },
    },
  };
};

const interpretCloudflareResponse = async (state) => {
  const { response } = state;

  if (!response?.ok) {
    return {};
  }

  const {
    success,
    errors,
    messages,
    result_info: resultInfo,
  } = response.data || {};

  if (success === false) {
    return {
      response: {
        ok: false,
        error: {
          code: 'CLOUDFLARE_API_ERROR',
          message: 'Cloudflare API returned success: false.',
          details: errors ?? response.data,
        },
      },
      breakChain: true,
    };
  }

  const meta = {
    ...messages?.length && { messages },
    ...resultInfo && { resultInfo },
  };

  if (!Object.keys(meta).length) {
    return {};
  }

  return {
    response: {
      meta,
    },
  };
};

const cloudflareClient = new FetchClient({
  pipeline: [
    resolveCreds,
    useBaseUrl(BASE_URL),
    useAuthHeaders,
    'fetch',
    fetchClientCommonSteps.exitEarlyOnNotOk,
    interpretCloudflareResponse,
    fetchClientCommonSteps.digToPath,
  ],
});

const cloudflareErrorsFromResponse = (response) => {
  const details = response?.error?.details;
  if (Array.isArray(details)) {
    return details;
  }
  if (Array.isArray(details?.errors)) {
    return details.errors;
  }
  return [];
};

const isMissingRulesetPhaseEntrypoint = (response) => (
  cloudflareErrorsFromResponse(response).some((error) => error?.code === 10003)
);

const normaliseRedirectDomain = (fromDomain) => (
  String(fromDomain)
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '')
    .toLowerCase()
);

const normaliseRedirectPath = (fromPath) => {
  if (fromPath === undefined || fromPath === null || fromPath === '') {
    return undefined;
  }

  const trimmed = String(fromPath).trim();
  if (!trimmed || trimmed === '/') {
    return '/';
  }

  return trimmed.startsWith('/') ? trimmed : `/${ trimmed }`;
};

const buildRedirectRuleRef = (fromDomain, fromPath) => {
  const domainPart = normaliseRedirectDomain(fromDomain).replace(/[^a-z0-9]+/g, '_');
  const pathPart = fromPath === undefined
    ? 'all'
    : fromPath === '/'
      ? 'root'
      : fromPath.replace(/^\//, '').replace(/[^a-zA-Z0-9]+/g, '_') || 'root';

  return `mineral_${ domainPart }_${ pathPart }`;
};

const buildRedirectRuleExpression = (fromDomain, fromPath) => {
  const host = normaliseRedirectDomain(fromDomain);
  const hostExpression = `http.host eq "${ host }"`;

  if (fromPath === undefined) {
    return hostExpression;
  }

  return `${ hostExpression } and http.request.uri.path eq "${ fromPath }"`;
};

const buildRedirectRulePayload = ({
  fromDomain,
  fromPath,
  toUrl,
  statusCode = 302,
  preserveQueryString = true,
  description,
  enabled = true,
}) => {
  const normalisedDomain = normaliseRedirectDomain(fromDomain);
  const normalisedPath = normaliseRedirectPath(fromPath);
  const ref = buildRedirectRuleRef(normalisedDomain, normalisedPath);
  const pathLabel = normalisedPath === undefined ? '' : normalisedPath;

  return {
    ref,
    expression: buildRedirectRuleExpression(normalisedDomain, normalisedPath),
    description: description ?? `Mineral redirect ${ normalisedDomain }${ pathLabel } → ${ toUrl }`,
    action: 'redirect',
    enabled,
    action_parameters: {
      from_value: {
        target_url: {
          value: toUrl,
        },
        status_code: statusCode,
        preserve_query_string: preserveQueryString,
      },
    },
  };
};

module.exports = {
  cloudflareClient,
  interpretCloudflareResponse,
  cloudflareErrorsFromResponse,
  isMissingRulesetPhaseEntrypoint,
  normaliseRedirectDomain,
  normaliseRedirectPath,
  buildRedirectRuleRef,
  buildRedirectRuleExpression,
  buildRedirectRulePayload,
};
