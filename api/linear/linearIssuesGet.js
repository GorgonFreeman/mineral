// https://linear.app/developers/graphql

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { linearGet, linearGetter } = require('./linearGet');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const linearIssuesGet = async (
  returnGetter,

  credsPayload,
  {
    attrs = `
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
    `,
    sortType = true,
    ...getterOptions
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const getterArgs = [
    credsPayload,
    'issue',
    {
      attrs,
      sortType,
      ...getterOptions,
    },
  ];

  return returnGetter
    ? linearGetter(...getterArgs)
    : linearGet(...getterArgs);
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  linearIssuesGet: linearIssuesGet.bind(null, false),
  linearIssuesGetter: linearIssuesGet.bind(null, true),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/linearIssuesGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "linear" },
    "options": {
      "limit": 5
    }
  }'
*/
