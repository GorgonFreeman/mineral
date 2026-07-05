// https://loyaltyapi.yotpo.com/reference/get-customer-anniversary

const { credsFromPayload, responseIfRejectingArgs } = require('../utils');
const { credsValidator } = require('../validators');
const { yotpoClient } = require('../yotpo/yotpo.utils');

const validatorsByArg = {
  credsPayload: credsValidator,
  customerEmail: Boolean,
};

const yotpoCustomerAnniversaryGet = async (
  credsPayload,
  customerEmail,
  {
    apiVersion,
  } = {},
) => {

  const rejectResponse = await responseIfRejectingArgs(validatorsByArg, {
    credsPayload,
    customerEmail,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const creds = await credsFromPayload(credsPayload);

  const response = await yotpoClient.fetch({
    url: '/customer_anniversary',
    params: {
      customer_email: customerEmail,
    },
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
    'customerEmail',
  ],
  validatorsByArg,
};

module.exports = {
  yotpoCustomerAnniversaryGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/yotpoCustomerAnniversaryGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "yotpo.au" },
    "customerEmail": "john@whitefoxboutique.com"
  }'
*/
