// https://api-docs.starshipit.com/#c96bed4f-3a89-4e97-abaa-b1775cc7c5a7

const { objHasAny, ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { starshipitClient } = require('../starshipit/starshipit.utils');
const { starshipitOrderGet } = require('../starshipit/starshipitOrderGet');

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

const resolveOrderId = async (credsPayload, orderIdentifier) => {
  const { orderId, orderNumber } = orderIdentifier;

  if (orderId) {
    return {
      ok: true,
      data: orderId,
    };
  }

  const orderResponse = await starshipitOrderGet(credsPayload, { orderNumber });

  if (!orderResponse?.ok) {
    return orderResponse;
  }

  const resolvedOrderId = orderResponse?.data?.order_id;

  if (!resolvedOrderId) {
    return {
      ok: false,
      error: {
        code: 'ORDER_NOT_FOUND',
        message: 'No order ID found',
      },
    };
  }

  return {
    ok: true,
    data: resolvedOrderId,
  };
};

const starshipitOrderDelete = async (
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

  const orderIdResponse = await resolveOrderId(credsPayload, orderIdentifier);
  if (!orderIdResponse?.ok) {
    return orderIdResponse;
  }

  return starshipitClient.fetch({
    requestPayload: {
      url: '/orders/delete',
      method: 'delete',
      params: {
        order_id: orderIdResponse.data,
      },
    },
    context: {
      credsPayload,
    },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  starshipitOrderDelete,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/starshipitOrderDelete" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "starshipit.acc" },
    "orderIdentifier": { "orderId": "408418809" }
  }'
*/
