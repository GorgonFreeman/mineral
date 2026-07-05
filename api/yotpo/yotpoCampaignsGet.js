// https://loyaltyapi.yotpo.com/reference/get-active-campaigns

const { credsFromPayload, responseIfRejectingArgs } = require('../utils');
const { credsValidator } = require('../validators');
const { yotpoClient } = require('../yotpo/yotpo.utils');

const validatorsByArg = {
  credsPayload: credsValidator,
};

const yotpoCampaignsGet = async (
  credsPayload,
  {
    apiVersion,
    withStatus,
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
  } = customerIdentifier ?? {};

  const params = {
    ...(withStatus !== undefined && { with_status: withStatus }),
    ...(customerId && { customer_id: customerId }),
    ...(customerEmail && { customer_email: customerEmail }),
  };

  const response = await yotpoClient.fetch({
    url: '/campaigns',
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
  yotpoCampaignsGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/yotpoCampaignsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "yotpo.au" }
  }'

curl -X POST "http://localhost:8000/yotpoCampaignsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "yotpo.au" },
    "options": {
      "withStatus": true,
      "customerIdentifier": { "customerEmail": "john@whitefoxboutique.com" }
    }
  }'
*/
