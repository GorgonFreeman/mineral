const {
  NOTION_API_BASE_URL,
  DEFAULT_NOTION_VERSION,
} = require('../notion/notion.constants');
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
    NOTION_VERSION,
  } = creds;
  const notionVersion = NOTION_VERSION ?? DEFAULT_NOTION_VERSION;

  return {
    requestPayload: {
      ...requestPayload,
      headers: {
        Authorization: `Bearer ${ API_KEY }`,
        'Notion-Version': notionVersion,
        ...requestPayload.headers,
      },
    },
  };
};

const notionClient = new FetchClient({
  pipeline: [
    resolveCreds,
    useBaseUrl(NOTION_API_BASE_URL),
    useAuthHeaders,
    'fetch',
    fetchClientCommonSteps.exitEarlyOnNotOk,
  ],
});

module.exports = {
  notionClient,
};
