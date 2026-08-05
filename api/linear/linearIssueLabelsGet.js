// https://linear.app/developers/graphql

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { linearGet, linearGetter } = require('./linearGet');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const linearIssueLabelsGet = async (
  returnGetter,

  credsPayload,
  {
    attrs = `
      id
      name
      color
      description
    `,
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
    'issueLabel',
    {
      attrs,
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
  linearIssueLabelsGet: linearIssueLabelsGet.bind(null, false),
  linearIssueLabelsGetter: linearIssueLabelsGet.bind(null, true),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/linearIssueLabelsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "linear" },
    "options": {
      "limit": 20
    }
  }'
*/
