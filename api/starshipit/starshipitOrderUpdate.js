// https://api-docs.starshipit.com/#c96bed4f-3a89-4e97-abaa-b1775cc7c5a7

const { objHasAny, ArgsWarden, credsFromPayload } = require('../utils');
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
  ['updatePayload'],
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

const starshipitOrderUpdate = async (
  credsPayload,
  orderIdentifier,
  updatePayload,
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    orderIdentifier,
    updatePayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const orderIdResponse = await resolveOrderId(credsPayload, orderIdentifier);
  if (!orderIdResponse?.ok) {
    return orderIdResponse;
  }

  const creds = await credsFromPayload(credsPayload);

  return starshipitClient.fetch({
    url: '/orders',
    method: 'put',
    body: {
      order: {
        order_id: orderIdResponse.data,
        ...updatePayload,
      },
    },
    context: {
      creds,
    },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  starshipitOrderUpdate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/starshipitOrderUpdate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "starshipit.acc" },
    "orderIdentifier": { "orderNumber": "7029471248456" },
    "updatePayload": { "destination": { "name": "Big Dog" } }
  }'
*/
