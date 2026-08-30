// https://developer.royalmail.net/product/175625/api/76888

const { ArgsWarden, objHasAny } = require('../utils');
const { credsValidator } = require('../validators');
const { ROYALMAIL_TRACKING_PATH } = require('./royalmail.constants');
const { royalmailClient } = require('./royalmail.utils');

const trackingIdentifierValidator = (trackingIdentifier) => {
  return objHasAny(trackingIdentifier, [
    'trackingNumber',
  ]);
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['trackingIdentifier', trackingIdentifierValidator],
]);

const royalmailTrackingGet = async (
  credsPayload,
  trackingIdentifier,
  {
    operation = 'summary',
    fetchClient = royalmailClient,
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
  const operationPath = operation === 'summary'
    ? `${ ROYALMAIL_TRACKING_PATH }/summary?mailPieceId=${ encodeURIComponent(trackingNumber) }`
    : `${ ROYALMAIL_TRACKING_PATH }/mailPieces/${ encodeURIComponent(trackingNumber) }/${ operation }`;

  return fetchClient.fetch({
    requestPayload: {
      url: operationPath,
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
  royalmailTrackingGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/royalmailTrackingGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "royalmail" },
    "trackingIdentifier": {
      "trackingNumber": "AA123456789GB"
    }
  }'
*/
