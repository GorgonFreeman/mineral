// https://developers.telnyx.com/api-reference/phone-numbers/create-a-number-order

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { telnyxClient } = require('../telnyx/telnyx.utils');

const orderValidator = (order) => {
  return order && typeof order === 'object' && Object.keys(order).length > 0;
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['order', orderValidator],
]);

const telnyxNumberOrderCreate = async (
  credsPayload,
  order,
  {
    inspect = false,
    fetchClient = telnyxClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    order,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'post',
      url: '/number_orders',
      body: order,
    },
    context: { credsPayload },
    inspect,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  telnyxNumberOrderCreate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/telnyxNumberOrderCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "telnyx" },
    "order": {
      "phone_numbers": [
        { "phone_number": "+61312345678" }
      ]
    }
  }'
*/
