// https://linear.app/developers/graphql

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { linearGet, linearGetter } = require('./linearGet');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const linearProjectsGet = async (
  returnGetter,

  credsPayload,
  {
    attrs = `
      id
      name
      description
      url
      state
      createdAt
      updatedAt
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
    'project',
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
  linearProjectsGet: linearProjectsGet.bind(null, false),
  linearProjectsGetter: linearProjectsGet.bind(null, true),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/linearProjectsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "linear" },
    "options": {
      "limit": 10
    }
  }'
*/
