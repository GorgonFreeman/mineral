// https://developer.paypal.com/docs/api/transaction-search/v1/#transactions_get

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { paypalClient } = require('../paypal/paypal.utils');
const { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } = require('../paypal/paypal.constants');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['startDate'],
  ['endDate'],
]);

/**
 * List transactions for the account (Transaction Search API).
 * startDate / endDate are ISO-8601 (e.g. 2024-01-01T00:00:00Z).
 * Date range must be ≤ 31 days per PayPal rules.
 */
const paypalTransactionsGet = async (
  credsPayload,
  startDate,
  endDate,
  {
    transactionId,
    transactionStatus,
    transactionType,
    paymentInstrumentType,
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    fields,
    balanceAffectingRecordsOnly,
    storeId,
    terminalId,
    fetchClient = paypalClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    startDate,
    endDate,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const size = Math.min(Number(pageSize) || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

  const response = await fetchClient.fetch({
    requestPayload: {
      method: 'get',
      url: '/v1/reporting/transactions',
      params: {
        start_date: startDate,
        end_date: endDate,
        page: Number(page) || 1,
        page_size: size,
        ...(transactionId ? { transaction_id: transactionId } : {}),
        ...(transactionStatus ? { transaction_status: transactionStatus } : {}),
        ...(transactionType ? { transaction_type: transactionType } : {}),
        ...(paymentInstrumentType
          ? { payment_instrument_type: paymentInstrumentType }
          : {}),
        ...(fields ? { fields } : {}),
        ...(balanceAffectingRecordsOnly !== undefined
          ? { balance_affecting_records_only: balanceAffectingRecordsOnly }
          : {}),
        ...(storeId ? { store_id: storeId } : {}),
        ...(terminalId ? { terminal_id: terminalId } : {}),
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
  paypalTransactionsGet,
  funcApiConfig,
};

/*
  curl -X POST "http://localhost:8000/paypalTransactionsGet" \
    -H "Content-Type: application/json" \
    -d '{
      "credsPayload": { "credsPath": "paypal" },
      "startDate": "2026-01-01T00:00:00Z",
      "endDate": "2026-01-31T23:59:59Z",
      "options": {
        "page": 1,
        "pageSize": 100
      }
    }'
*/
