// https://linear.app/developers/graphql

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { linearGet, linearGetter } = require('./linearGet');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const linearTeamsGet = async (
  returnGetter,

  credsPayload,
  {
    attrs = `
      id
      name
      key
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
    'team',
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
  linearTeamsGet: linearTeamsGet.bind(null, false),
  linearTeamsGetter: linearTeamsGet.bind(null, true),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/linearTeamsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "linear" },
    "options": {
      "limit": 10
    }
  }'

curl -X POST "http://localhost:8000/linearTeamsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "linear" },
    "options": {
      "filter": {
        "name": {
          "eq": "WF Engineering"
        }
      }
    }
  }'
*/
