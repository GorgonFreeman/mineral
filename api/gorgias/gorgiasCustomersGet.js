// https://developers.gorgias.com/reference/list-customers

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { gorgiasGet, gorgiasGetter } = require('../gorgias/gorgiasGet');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const gorgiasCustomersGet = async (
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
    '/customers',
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
  gorgiasCustomersGet: (...args) => gorgiasCustomersGet(false, ...args),
  gorgiasCustomersGetter: (...args) => gorgiasCustomersGet(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/gorgiasCustomersGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "gorgias" },
    "options": {
      "params": { "email": "customer@example.com" },
      "limit": 10
    }
  }'
*/
