// https://linear.app/developers/graphql

const { FetchClient, credsFromPayload, responseIfRejectingArgs } = require('../utils');
const { credsValidator } = require('../validators');

const LINEAR_GRAPHQL_URL = 'https://api.linear.app/graphql';

const linearClient = new FetchClient({
  requestPreparer: async (requestPayload, context) => {
    const { creds } = context;
    const { API_KEY } = creds;

    return {
      ...requestPayload,
      method: requestPayload.method || 'post',
      headers: {
        'Content-Type': 'application/json',
        Authorization: API_KEY,
        ...requestPayload.headers,
      },
    };
  },
  responseInterpreter: async (response) => {
    if (!response.ok) {
      return response;
    }

    const errors = response.data?.errors;

    if (Array.isArray(errors) && errors.length) {
      const message = errors
        .map((error) => error?.message)
        .filter(Boolean)
        .join('; ');

      return {
        ok: false,
        error: {
          code: 'GRAPHQL_ERROR',
          message: message || 'GraphQL request failed',
          details: errors,
        },
      };
    }

    return response;
  },
});

const validatorsByArg = {
  credsPayload: credsValidator,
};

const linearIssuesGet = async (
  credsPayload,
  {
    first = 50,
    teamId,
    inspect = false,
  } = {},
) => {

  const rejectResponse = await responseIfRejectingArgs(validatorsByArg, {
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const creds = await credsFromPayload(credsPayload);

  const filter = teamId
    ? { team: { id: { eq: teamId } } }
    : undefined;

  const response = await linearClient.fetch({
    url: LINEAR_GRAPHQL_URL,
    method: 'post',
    body: {
      query: `
        query IssuesGet($first: Int!, $filter: IssueFilter) {
          issues(first: $first, filter: $filter) {
            nodes {
              id
              identifier
              title
              priority
              createdAt
              updatedAt
              state {
                id
                name
              }
              team {
                id
                name
              }
              assignee {
                id
                name
              }
            }
          }
        }
      `,
      variables: {
        first,
        ...(filter && { filter }),
      },
    },
    context: { creds },
    inspect,
  });

  if (!response.ok) {
    return response;
  }

  const issues = response.data?.data?.issues?.nodes ?? [];

  return {
    ok: true,
    data: issues,
  };
};

const funcApiConfig = {
  argNames: ['credsPayload'],
  validatorsByArg,
};

module.exports = {
  linearIssuesGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/linearIssuesGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "linear" }
  }'

curl -X POST "http://localhost:8000/linearIssuesGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "linear" },
    "options": {
      "first": 5
    }
  }'
*/
