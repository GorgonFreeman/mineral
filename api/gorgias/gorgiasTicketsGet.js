// https://developers.gorgias.com/reference/list-tickets

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { gorgiasGet, gorgiasGetter } = require('../gorgias/gorgiasGet');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const gorgiasTicketsGet = async (
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
    '/tickets',
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
  gorgiasTicketsGet: (...args) => gorgiasTicketsGet(false, ...args),
  gorgiasTicketsGetter: (...args) => gorgiasTicketsGet(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/gorgiasTicketsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "gorgias" },
    "options": {
      "params": {
        "order_by": "created_datetime:desc"
      },
      "limit": 10
    }
  }'
*/
