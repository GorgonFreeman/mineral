const crypto = require('crypto');
const { API_BASE_PATH } = require('../threeclicks/threeclicks.constants');
const { resolveCreds } = require('../pipelineSteps');
const {
  FetchClient,
  appendUrlToBase,
  fetchClientCommonSteps,
} = require('../utils');

const nowAsUnixTimestamp = () => Math.floor(Date.now() / 1000);

const threeclicksSignatureCalculate = ({
  creds,
  method,
  data,
}) => {
  const {
    API_KEY,
    API_SECRET,
  } = creds;

  const timestamp = nowAsUnixTimestamp();
  const stitchedString = `${ API_KEY }${ API_SECRET }${ method }${
    data ? JSON.stringify(data) : ''
  }${ timestamp }`;

  const signature = crypto
    .createHmac('sha256', API_SECRET)
    .update(stitchedString)
    .digest('hex');

  return {
    signature,
    timestamp,
  };
};

const getSignatureData = (requestPayload) => {
  const method = (requestPayload.method || 'get').toLowerCase();

  if (method === 'get') {
    return requestPayload.params ?? {};
  }

  return requestPayload.body ?? {};
};

const useThreeclicksUrlAndAuth = async (state) => {
  const { requestPayload, context } = state;
  const { creds } = context;
  const {
    API_KEY,
    API_DOMAIN,
  } = creds;

  const method = (requestPayload.method || 'get').toLowerCase();
  const signatureData = getSignatureData({
    ...requestPayload,
    method,
  });

  const { signature, timestamp } = threeclicksSignatureCalculate({
    creds,
    method,
    data: signatureData,
  });

  const baseUrl = `https://${ API_DOMAIN }${ API_BASE_PATH }`;

  return {
    requestPayload: {
      ...requestPayload,
      method,
      url: appendUrlToBase(baseUrl, requestPayload.url),
      headers: {
        'X-Api-Key': API_KEY,
        'X-Api-Signature': signature,
        'X-Api-Timestamp': String(timestamp),
        ...requestPayload.headers,
      },
    },
  };
};

const interpretThreeclicksResponse = async (state) => {
  const { response } = state;
  const { success, message } = response?.data?.result ?? {};

  if (response?.ok && success === false) {
    return {
      response: {
        ok: false,
        error: {
          message,
          details: response.data?.result,
        },
      },
      breakChain: true,
    };
  }

  return {};
};

const threeclicksClient = new FetchClient({
  pipeline: [
    resolveCreds,
    useThreeclicksUrlAndAuth,
    'fetch',
    fetchClientCommonSteps.exitEarlyOnNotOk,
    interpretThreeclicksResponse,
  ],
});

module.exports = {
  threeclicksClient,
  threeclicksSignatureCalculate,
  getSignatureData,
};
