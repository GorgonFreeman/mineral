const { credsValidator } = require('../validators');
const { ArgsWarden, FetchClientV2, useBaseUrl, appendUrlToBase, logDeep } = require('../utils');
const { BASE_URL } = require('../bleckmann/bleckmann.constants');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['asnId'],
]);

const bleckmannAsnGet = async (
  credsPayload,
  asnId,
  options = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({ 
    credsPayload, 
    asnId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const useBaseUrl = (state) => {
    const { context, requestPayload } = state;
    const { baseUrl } = context;
    const { url } = requestPayload;
    logDeep(state);
    return {
      requestPayload: {
        ...requestPayload,
        url: appendUrlToBase(baseUrl, url),
      },
    };
  };

  const bleckmannFetchClient = new FetchClientV2({
    pipeline: [
      useBaseUrl,
      'fetch',
    ],
  });
  const response = await bleckmannFetchClient.fetch({
    requestPayload: {
      url: `/warehousing/asns/${ asnId }`,
    },
    context: {
      credsPayload,
      baseUrl: BASE_URL,
    },
  });

  return response;
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  bleckmannAsnGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/bleckmannAsnGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "bleckmann" },
    "asnId": "UK-AG002594"
  }'
*/
