// https://linear.app/developers/graphql

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { linearGet, linearGetter } = require('./linearGet');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const linearCommentsGet = async (
  returnGetter,

  credsPayload,
  {
    attrs = `
      id
      body
      createdAt
      updatedAt
      user {
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
    'comment',
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
  linearCommentsGet: linearCommentsGet.bind(null, false),
  linearCommentsGetter: linearCommentsGet.bind(null, true),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/linearCommentsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "linear" },
    "options": {
      "limit": 10
    }
  }'
*/
