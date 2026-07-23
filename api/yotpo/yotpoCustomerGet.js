// https://loyaltyapi.yotpo.com/reference/fetch-customer-details

const { objHasAny, ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { yotpoClient } = require('../yotpo/yotpo.utils');

const customerIdentifierValidator = (customerIdentifier) => {
  return objHasAny(customerIdentifier, [
    'customerId',
    'customerEmail',
    'customerPhone',
    'posAccountId',
  ]);
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['customerIdentifier', customerIdentifierValidator],
]);

const yotpoCustomerGet = async (
  credsPayload,
  customerIdentifier,
  {
    apiVersion,
    countryCodeIso,
    withReferralCode,
    withHistory,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    customerIdentifier,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const {
    customerId,
    customerEmail,
    customerPhone,
    posAccountId,
  } = customerIdentifier;

  const params = {
    ...(customerId && { customer_id: customerId }),
    ...(customerEmail && { customer_email: customerEmail }),
    ...(customerPhone && { phone_number: customerPhone }),
    ...(posAccountId && { pos_account_id: posAccountId }),
    ...(countryCodeIso && { country_code_iso: countryCodeIso }),
    ...(withReferralCode !== undefined && { with_referral_code: withReferralCode }),
    ...(withHistory !== undefined && { with_history: withHistory }),
  };

  const response = await yotpoClient.fetch({
    requestPayload: {
      url: '/customers',
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
  yotpoCustomerGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/yotpoCustomerGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": {
      "credsObject": {
        "API_KEY": "xxx",
        "GUID": "xxx"
      }
    },
    "customerIdentifier": {
      "customerEmail": "john@example.com"
    },
    "options": {
      "withHistory": true
    }
  }'

curl -X POST "http://localhost:8000/yotpoCustomerGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "yotpo.au" },
    "customerIdentifier": { "customerEmail": "john@whitefoxboutique.com" }
  }'
*/
