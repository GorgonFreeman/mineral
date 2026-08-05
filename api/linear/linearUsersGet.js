// https://linear.app/developers/graphql

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { linearGet, linearGetter } = require('./linearGet');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const linearUsersGet = async (
  returnGetter,

  credsPayload,
  {
    attrs = `
      id
      name
      displayName
      email
      active
    `,
    sortType = true,
    supportsIncludeDisabled = true,
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
    'user',
    {
      attrs,
      sortType,
      supportsIncludeDisabled,
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
  linearUsersGet: linearUsersGet.bind(null, false),
  linearUsersGetter: linearUsersGet.bind(null, true),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/linearUsersGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "linear" },
    "options": {
      "limit": 10
    }
  }'
*/
