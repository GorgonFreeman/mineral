// https://linear.app/developers/graphql

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { linearGet, linearGetter } = require('./linearGet');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const linearWorkflowStatesGet = async (
  returnGetter,

  credsPayload,
  {
    attrs = `
      id
      name
      type
      position
      team {
        id
        name
      }
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
    'workflowState',
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
  linearWorkflowStatesGet: linearWorkflowStatesGet.bind(null, false),
  linearWorkflowStatesGetter: linearWorkflowStatesGet.bind(null, true),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/linearWorkflowStatesGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "linear" },
    "options": {
      "limit": 20,
      "filter": {
        "team": { "id": { "eq": "f2387dcd-61ac-49aa-8d7a-7f62a0b5cca0" } }
      }
    }
  }'
*/
