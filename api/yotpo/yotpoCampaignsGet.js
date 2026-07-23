// https://loyaltyapi.yotpo.com/reference/get-active-campaigns

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { yotpoClient } = require('../yotpo/yotpo.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const yotpoCampaignsGet = async (
  credsPayload,
  {
    apiVersion,
    withStatus,
    customerIdentifier,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({ credsPayload });
  if (rejectResponse) {
    return rejectResponse;
  }

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
    requestPayload: {
      url: '/campaigns',
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
