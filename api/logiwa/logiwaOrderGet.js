// https://myapi.logiwa.com/swagger/index.html#/ShipmentOrder/get_v3_1_ShipmentOrder__identifier_

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { logiwaClient } = require('../logiwa/logiwa.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['orderId'],
]);

const logiwaOrderGet = async (
  credsPayload,
  orderId, // Logiwa order UUID
  {
    apiVersion,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    orderId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return logiwaClient.fetch({
    method: 'get',
    url: `/ShipmentOrder/${ orderId }`,
    context: {
      credsPayload,
      apiVersion,
    },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  logiwaOrderGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/logiwaOrderGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "logiwa" },
    "orderId": "d53b375b-835d-4450-b71b-65e333f6709b"
  }'
*/
