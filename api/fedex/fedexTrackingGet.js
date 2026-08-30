// https://developer.fedex.com/api/en-us/catalog/track.html

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { FEDEX_TRACKING_PATH } = require('./fedex.constants');
const { fedexClient } = require('./fedex.utils');

const trackingIdentifierValidator = (trackingIdentifier) => {
  return Boolean(trackingIdentifier?.trackingNumber);
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['trackingIdentifier', trackingIdentifierValidator],
]);

const fedexTrackingGet = async (
  credsPayload,
  trackingIdentifier,
  {
    includeDetailedScans = true,
    fetchClient = fedexClient,
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
      method: 'post',
      url: FEDEX_TRACKING_PATH,
      body: {
        includeDetailedScans,
        trackingInfo: [
          {
            trackingNumberInfo: {
              trackingNumber,
            },
          },
        ],
      },
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
  fedexTrackingGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/fedexTrackingGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "fedex" },
    "trackingIdentifier": {
      "trackingNumber": "872442694112"
    }
  }'
*/
