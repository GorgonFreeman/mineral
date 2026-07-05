// https://loyaltyapi.yotpo.com/reference/fetch-active-redemption-options

const { credsFromPayload, responseIfRejectingArgs } = require('../utils');
const { credsValidator } = require('../validators');
const { yotpoClient } = require('../yotpo/yotpo.utils');

const validatorsByArg = {
  credsPayload: credsValidator,
};

const yotpoRedemptionOptionsGet = async (
  credsPayload,
  {
    apiVersion,
    isOffline,
    discountType,
    customerIdentifier,
  } = {},
) => {

  const rejectResponse = await responseIfRejectingArgs(validatorsByArg, { credsPayload });
  if (rejectResponse) {
    return rejectResponse;
  }

  const creds = await credsFromPayload(credsPayload);

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
    url: '/redemption_options',
    params,
    context: {
      creds,
      apiVersion,
    },
  });

  return response;
};

const funcApiConfig = {
  argNames: [
    'credsPayload',
  ],
  validatorsByArg,
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
