// https://apidoc.pipe17.com/#/operations/listOrders

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { pipe17Client } = require('../pipe17/pipe17.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const pipe17OrdersGet = async (
  credsPayload,
  {
    params,
    inspect = false,
    fetchClient = pipe17Client,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'get',
      url: '/orders',
      params,
    },
    context: { credsPayload },
    inspect,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  pipe17OrdersGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/pipe17OrdersGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "pipe17" },
    "options": { "params": { "count": 5 } }
  }'
*/
