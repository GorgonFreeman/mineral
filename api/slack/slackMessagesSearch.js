// https://docs.slack.dev/reference/methods/search.messages

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { slackClient } = require('../slack/slack.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['query'],
]);

const slackMessagesSearch = async (
  credsPayload,
  query,
  {
    count,
    page,
    sort,
    sortDir,
    highlight,
    useTokenType = 'user',
    inspect = false,
    fetchClient = slackClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    query,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const searchParams = new URLSearchParams({
    query,
    ...count != null && { count: String(count) },
    ...page != null && { page: String(page) },
    ...sort && { sort },
    ...sortDir && { sort_dir: sortDir },
    ...highlight != null && { highlight: String(highlight) },
  });

  const response = await fetchClient.fetch({
    requestPayload: {
      url: `/search.messages?${ searchParams }`,
      method: 'get',
    },
    context: {
      credsPayload,
      useTokenType,
    },
    inspect,
  });

  return response;
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  slackMessagesSearch,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/slackMessagesSearch" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "slack" },
    "query": "in:#project_canada_migration",
    "options": {
      "count": 5,
      "sort": "timestamp",
      "sortDir": "desc",
      "useTokenType": "user"
    }
  }'
*/
