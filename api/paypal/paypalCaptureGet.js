// https://developer.paypal.com/docs/api/payments/v2/#captures_get

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { paypalClient } = require('../paypal/paypal.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['captureId'],
]);

const paypalCaptureGet = async (
  credsPayload,
  captureId,
  {
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

  const response = await fetchClient.fetch({
    requestPayload: {
      method: 'get',
      url: `/v2/payments/captures/${ encodeURIComponent(captureId) }`,
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
  paypalCaptureGet,
  funcApiConfig,
};

/*
  curl -X POST "http://localhost:8000/paypalCaptureGet" \
    -H "Content-Type: application/json" \
    -d '{
      "credsPayload": { "credsPath": "paypal.personal" },
      "captureId": "2GG279541U471931P"
    }'
*/
