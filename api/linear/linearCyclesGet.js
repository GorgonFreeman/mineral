// https://linear.app/developers/graphql

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { linearGet, linearGetter } = require('./linearGet');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const linearCyclesGet = async (
  returnGetter,

  credsPayload,
  {
    attrs = `
      id
      name
      number
      startsAt
      endsAt
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
    'cycle',
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
  linearCyclesGet: linearCyclesGet.bind(null, false),
  linearCyclesGetter: linearCyclesGet.bind(null, true),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/linearCyclesGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "linear" },
    "options": {
      "limit": 5
    }
  }'
*/
