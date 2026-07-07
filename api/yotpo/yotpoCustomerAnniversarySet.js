// https://loyaltyapi.yotpo.com/reference/createupdate-customer-anniversary

const { credsFromPayload, ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { yotpoClient } = require('../yotpo/yotpo.utils');

const dayValidator = Number;
const monthValidator = Number;

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['customerEmail', Boolean],
  ['day', dayValidator],
  ['month', monthValidator],
]);

const yotpoCustomerAnniversarySet = async (
  credsPayload,
  customerEmail,
  day,
  month,
  {
    apiVersion,
    year,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    customerEmail,
    day,
    month,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const creds = await credsFromPayload(credsPayload);

  const body = {
    customer_email: customerEmail,
    day: Number(day),
    month: Number(month),
    ...(year !== undefined && { year: Number(year) }),
  };

  const response = await yotpoClient.fetch({
    url: '/customer_anniversary',
    method: 'post',
    body,
    context: {
      creds,
      apiVersion,
    },
  });

  return response;
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  yotpoCustomerAnniversarySet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/yotpoCustomerAnniversarySet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "yotpo.au" },
    "customerEmail": "john@whitefoxboutique.com",
    "day": 1,
    "month": 7
  }'
*/
