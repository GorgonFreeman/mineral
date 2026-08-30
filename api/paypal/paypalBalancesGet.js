// https://developer.paypal.com/docs/api/transaction-search/v1/#balances_get

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { paypalClient } = require('../paypal/paypal.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

/**
 * List balances for the account. Optional asOfTime is ISO-8601.
 */
const paypalBalancesGet = async (
  credsPayload,
  {
    asOfTime,
    currencyCode,
    fetchClient = paypalClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const response = await fetchClient.fetch({
    requestPayload: {
      method: 'get',
      url: '/v1/reporting/balances',
      params: {
        ...(asOfTime ? { as_of_time: asOfTime } : {}),
        ...(currencyCode ? { currency_code: currencyCode } : {}),
      },
    },
    context: {
      credsPayload,
    },
  });

  return response;
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  paypalBalancesGet,
  funcApiConfig,
};

/*
  curl -X POST "http://localhost:8000/paypalBalancesGet" \
    -H "Content-Type: application/json" \
    -d '{
      "credsPayload": { "credsPath": "paypal" },
      "options": {
        "currencyCode": "USD"
      }
    }'
*/
