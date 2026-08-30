// https://www.dpd.com/wp-content/uploads/sites/235/2023/04/DPD-API-documentation-v1-2-1.pdf

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { DPD_TRACKING_PATH } = require('./dpd.constants');
const { dpdClient } = require('./dpd.utils');

const trackingIdentifierValidator = (trackingIdentifier) => {
  return Boolean(trackingIdentifier?.trackingNumber);
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['trackingIdentifier', trackingIdentifierValidator],
]);

const dpdTrackingGet = async (
  credsPayload,
  trackingIdentifier,
  {
    fetchClient = dpdClient,
  } = {},
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
  } = trackingIdentifier;

  return fetchClient.fetch({
    requestPayload: {
      url: `${ DPD_TRACKING_PATH }/${ encodeURIComponent(trackingNumber) }`,
    },
    context: {
      credsPayload,
    },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  dpdTrackingGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/dpdTrackingGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "dpd" },
    "trackingIdentifier": {
      "trackingNumber": "15509742315259"
    }
  }'
*/
