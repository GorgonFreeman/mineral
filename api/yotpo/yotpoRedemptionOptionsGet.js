// https://loyaltyapi.yotpo.com/reference/fetch-active-redemption-options

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { yotpoClient } = require('../yotpo/yotpo.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const yotpoRedemptionOptionsGet = async (
  credsPayload,
  {
    apiVersion,
    isOffline,
    discountType,
    customerIdentifier,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const {
    customerId,
    customerEmail,
    phoneNumber,
  } = customerIdentifier ?? {};

  const params = {
    ...(isOffline !== undefined && { is_offline: isOffline }),
    ...(discountType && { discount_type: discountType }),
    ...(customerId && { customer_id: customerId }),
    ...(customerEmail && { customer_email: customerEmail }),
    ...(phoneNumber && { phone_number: phoneNumber }),
  };

  const response = await yotpoClient.fetch({
    requestPayload: {
      url: '/redemption_options',
      params,
    },
    context: {
      credsPayload,
      apiVersion,
    },
  });

  return response;
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  yotpoRedemptionOptionsGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/yotpoRedemptionOptionsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "yotpo.au" }
  }'

curl -X POST "http://localhost:8000/yotpoRedemptionOptionsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "yotpo.au" },
    "options": {
      "customerIdentifier": { "customerEmail": "john@whitefoxboutique.com" }
    }
  }'
*/
