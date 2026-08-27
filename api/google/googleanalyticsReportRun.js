// https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/runReport

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

const googleanalyticsReportRun = async (
  credsPayload,
  propertyIdentifier,
  {
    subject,
    dateRanges,
    dimensions,
    metrics,
    dimensionFilter,
    metricFilter,
    offset,
    limit,
    metricAggregations,
    orderBys,
    currencyCode,
    cohortSpec,
    keepEmptyRows,
    returnPropertyQuota,
    comparisons,
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

  return googleApiCall(() => client.properties.runReport({
    property: propertyName,
    requestBody: {
      ...dateRanges && { dateRanges },
      ...formattedDimensions && { dimensions: formattedDimensions },
      ...formattedMetrics && { metrics: formattedMetrics },
      ...dimensionFilter && { dimensionFilter },
      ...metricFilter && { metricFilter },
      ...offset !== undefined && { offset },
      ...limit !== undefined && { limit },
      ...metricAggregations && { metricAggregations },
      ...orderBys && { orderBys },
      ...currencyCode && { currencyCode },
      ...cohortSpec && { cohortSpec },
      ...keepEmptyRows !== undefined && { keepEmptyRows },
      ...returnPropertyQuota !== undefined && { returnPropertyQuota },
      ...comparisons && { comparisons },
    },
  }));
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  googleanalyticsReportRun,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/googleanalyticsReportRun" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "google" },
    "propertyIdentifier": { "propertyId": "402247571" },
    "options": {
      "dateRanges": [{ "startDate": "30daysAgo", "endDate": "today" }],
      "dimensions": ["date"],
      "metrics": ["activeUsers", "sessions"]
    }
  }'
*/
