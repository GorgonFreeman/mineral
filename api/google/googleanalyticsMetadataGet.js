// https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/getMetadata

const { ArgsWarden, objHasAny } = require('../utils');
const { credsValidator } = require('../validators');
const { getGoogleAnalyticsData, googleApiCall } = require('../google/google.utils');

const propertyIdentifierValidator = (propertyIdentifier) => {
  return objHasAny(propertyIdentifier, ['propertyId', 'property']);
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['propertyIdentifier', propertyIdentifierValidator],
]);

const googleanalyticsMetadataGet = async (
  credsPayload,
  propertyIdentifier,
  {
    subject,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    propertyIdentifier,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const { propertyId, property } = propertyIdentifier;
  const propertyName = property ?? `properties/${ propertyId }`;

  const { client, error } = await getGoogleAnalyticsData(credsPayload, { subject });

  if (error) {
    return error;
  }

  return googleApiCall(() => client.properties.getMetadata({
    name: `${ propertyName }/metadata`,
  }));
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  googleanalyticsMetadataGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/googleanalyticsMetadataGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "google" },
    "propertyIdentifier": { "propertyId": "402247571" }
  }'
*/
