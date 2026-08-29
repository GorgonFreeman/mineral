// https://developer.paypal.com/docs/api/payments/v2/#captures_refund

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { paypalClient } = require('../paypal/paypal.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['captureId'],
]);

/**
 * Refund a captured payment. Optional `refund` body can include amount,
 * invoice_id, note_to_payer, etc. Omit body (or pass {}) for a full refund.
 */
const paypalCaptureRefund = async (
  credsPayload,
  captureId,
  {
    refund,
    prefer = 'return=representation',
    requestId,
    fetchClient = paypalClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    captureId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const headers = {
    Prefer: prefer,
  };
  if (requestId) {
    headers['PayPal-Request-Id'] = requestId;
  }

  const response = await fetchClient.fetch({
    requestPayload: {
      method: 'post',
      url: `/v2/payments/captures/${ encodeURIComponent(captureId) }/refund`,
      headers,
      body: refund !== undefined ? refund : {},
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
  paypalCaptureRefund,
  funcApiConfig,
};

/*
  curl -X POST "http://localhost:8000/paypalCaptureRefund" \
    -H "Content-Type: application/json" \
    -d '{
      "credsPayload": { "credsPath": "paypal.personal" },
      "captureId": "2GG279541U471931P",
      "options": {
        "refund": {
          "amount": { "value": "10.00", "currency_code": "USD" }
        }
      }
    }'
*/
