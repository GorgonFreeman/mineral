// https://api-docs.starshipit.com/#05a846b9-0128-4dd3-80e4-e6008aef9b94

const { credsFromPayload, objHasAny, ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { starshipitClient } = require('../starshipit/starshipit.utils');

const trackingIdentifierValidator = (trackingIdentifier) => {
  return objHasAny(trackingIdentifier, [
    'trackingNumber',
    'orderNumber',
  ]);
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['trackingIdentifier', trackingIdentifierValidator],
]);

const starshipitTrackingGet = async (
  credsPayload,
  trackingIdentifier,
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    trackingIdentifier,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const {
    trackingNumber,
    orderNumber,
  } = trackingIdentifier;

  const creds = await credsFromPayload(credsPayload);

  const response = await starshipitClient.fetch({
    url: '/track',
    params: {
      ...trackingNumber && { tracking_number: trackingNumber },
      ...orderNumber && { order_number: orderNumber },
    },
    context: {
      creds,
    },
  });

  return response;
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  starshipitTrackingGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/starshipitTrackingGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "starshipit.wf" },
    "trackingIdentifier": { "orderNumber": "7726760919112" }
  }'
*/
