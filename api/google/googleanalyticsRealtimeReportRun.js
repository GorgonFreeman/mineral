// https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/runRealtimeReport

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

const formatDimensions = (dimensions) => {
  if (!dimensions) {
    return undefined;
  }
  return dimensions.map((dim) => (typeof dim === 'string' ? { name: dim } : dim));
};

const formatMetrics = (metrics) => {
  if (!metrics) {
    return undefined;
  }
  return metrics.map((metric) => (typeof metric === 'string' ? { name: metric } : metric));
};

const googleanalyticsRealtimeReportRun = async (
  credsPayload,
  propertyIdentifier,
  {
    subject,
    dimensions,
    metrics,
    dimensionFilter,
    metricFilter,
    limit,
    metricAggregations,
    orderBys,
    returnPropertyQuota,
    minuteRanges,
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

  const formattedDimensions = formatDimensions(dimensions);
  const formattedMetrics = formatMetrics(metrics);

  return googleApiCall(() => client.properties.runRealtimeReport({
    property: propertyName,
    requestBody: {
      ...formattedDimensions && { dimensions: formattedDimensions },
      ...formattedMetrics && { metrics: formattedMetrics },
      ...dimensionFilter && { dimensionFilter },
      ...metricFilter && { metricFilter },
      ...limit !== undefined && { limit },
      ...metricAggregations && { metricAggregations },
      ...orderBys && { orderBys },
      ...returnPropertyQuota !== undefined && { returnPropertyQuota },
      ...minuteRanges && { minuteRanges },
    },
  }));
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  googleanalyticsRealtimeReportRun,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/googleanalyticsRealtimeReportRun" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "google" },
    "propertyIdentifier": { "propertyId": "402247571" },
    "options": {
      "dimensions": ["country"],
      "metrics": ["activeUsers"]
    }
  }'
*/
