// https://loyaltyapi.yotpo.com/reference/set-customer-birthday

const { credsFromPayload, objHasAny, ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { yotpoClient } = require('../yotpo/yotpo.utils');

const customerIdentifierValidator = (customerIdentifier) => {
  return objHasAny(customerIdentifier, [
    'customerId',
    'customerEmail',
  ]);
};

const dayValidator = Number;
const monthValidator = Number;

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['customerIdentifier', customerIdentifierValidator],
  ['day', dayValidator],
  ['month', monthValidator],
]);

const yotpoCustomerBirthdaySet = async (
  credsPayload,
  customerIdentifier,
  day,
  month,
  {
    apiVersion,
    year,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    customerIdentifier,
    day,
    month,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const creds = await credsFromPayload(credsPayload);

  const {
    customerId,
    customerEmail,
  } = customerIdentifier;

  const body = {
    day: Number(day),
    month: Number(month),
    ...(customerId && { customer_id: customerId }),
    ...(customerEmail && { customer_email: customerEmail }),
    ...(year !== undefined && { year: Number(year) }),
  };

  const response = await yotpoClient.fetch({
    url: '/customer_birthdays',
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
  yotpoCustomerBirthdaySet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/yotpoCustomerBirthdaySet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "yotpo.au" },
    "customerIdentifier": { "customerEmail": "john@whitefoxboutique.com" },
    "day": 1,
    "month": 7
  }'
*/
