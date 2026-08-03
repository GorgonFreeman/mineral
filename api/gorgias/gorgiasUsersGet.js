// https://developers.gorgias.com/reference/list-users

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { gorgiasGet, gorgiasGetter } = require('../gorgias/gorgiasGet');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const gorgiasUsersGet = async (
  returnGetter,

  credsPayload,
  getterOptions = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const getterArgs = [
    credsPayload,
    '/users',
    getterOptions,
  ];

  return returnGetter
    ? gorgiasGetter(...getterArgs)
    : gorgiasGet(...getterArgs);
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  gorgiasUsersGet: (...args) => gorgiasUsersGet(false, ...args),
  gorgiasUsersGetter: (...args) => gorgiasUsersGet(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/gorgiasUsersGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "gorgias" }
  }'
*/
