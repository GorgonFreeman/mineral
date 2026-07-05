// https://loyaltyapi.yotpo.com/reference/fetch-customer-details

const {
  FetchClient,
  Chain,
  appendUrlToBase,
  credsFromPayload,
  objHasAny,
  responseIfRejectingArgs,
  fetchClientCommonSteps,
} = require('../utils');
const { credsValidator } = require('../validators');

const DEFAULT_API_VERSION = 'v2';
const BASE_URL = 'https://loyalty.yotpo.com/api';

const yotpoClient = new FetchClient({
  requestPreparer: new Chain([
    async (state) => {
      const { requestPayload, context } = state;
      const { creds, apiVersion = DEFAULT_API_VERSION } = context;
      const { API_KEY, GUID } = creds;

      return {
        requestPayload: {
          ...requestPayload,
          url: appendUrlToBase(`${ BASE_URL }/${ apiVersion }`, requestPayload.url),
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY,
            'x-guid': GUID,
            ...requestPayload.headers,
          },
        },
      };
    },
  ]),
  responseInterpreter: new Chain([
    fetchClientCommonSteps.exitEarlyOnNotOk,
    fetchClientCommonSteps.digToPath,
  ]),
});

const customerIdentifierValidator = (customerIdentifier) => {
  return objHasAny(customerIdentifier, [
    'customerId', 
    'customerEmail', 
    'customerPhone', 
    'posAccountId',
  ]);
};

const validatorsByArg = {
  credsPayload: credsValidator,
  customerIdentifier: customerIdentifierValidator,
};

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

  const rejectResponse = await responseIfRejectingArgs(validatorsByArg, { 
    credsPayload, 
    customerIdentifier, 
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const creds = await credsFromPayload(credsPayload);

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
    url: '/customers',
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
    'customerIdentifier',
  ],
  validatorsByArg,
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
