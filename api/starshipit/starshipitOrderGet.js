const { credsFromPayload, objHasAny, ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { starshipitClient } = require('../starshipit/starshipit.utils');

const orderIdentifierValidator = (orderIdentifier) => {
  return objHasAny(orderIdentifier, [
    'orderId',
    'orderNumber',
  ]);
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['orderIdentifier', orderIdentifierValidator],
]);

const starshipitOrderGet = async (
  credsPayload,
  orderIdentifier,
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    orderIdentifier,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const {
    orderId,
    orderNumber,
  } = orderIdentifier;

  const creds = await credsFromPayload(credsPayload);

  const response = await starshipitClient.fetch({
    url: '/orders',
    params: {
      ...orderId && { order_id: orderId },
      ...orderNumber && { order_number: orderNumber },
    },
    context: {
      creds,
    },
  });

  if (!response?.ok) {
    return response;
  }

  return {
    ...response,
    data: response.data?.order ?? response.data,
  };
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  starshipitOrderGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/starshipitOrderGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "starshipit.acc" },
    "orderIdentifier": { "orderId": 408418809 }
  }'
*/
