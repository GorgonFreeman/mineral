// https://g40-server.instance.3clickscloud.com/swagger-ui/index.html#operations-v1_-_Search_>_Advanced-shippingSearch

const { ArgsWarden, timeMs } = require('../utils');
const { credsValidator } = require('../validators');
const { threeclicksGet } = require('../threeclicks/threeclicksGet');

const argsWarden = new ArgsWarden([['credsPayload', credsValidator]]);

const threeclicksShipmentsGet = async (
  credsPayload,
  {
    mode = 'all',
    updatedSinceDaysAgo,
    updatedSinceHoursAgo,
    ...getterOptions
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({ credsPayload });
  if (rejectResponse) return rejectResponse;

  const updatedSinceUnix = updatedSinceDaysAgo
    ? Math.floor((Date.now() - timeMs.days(updatedSinceDaysAgo)) / 1000).toString()
    : updatedSinceHoursAgo
      ? Math.floor((Date.now() - timeMs.hours(updatedSinceHoursAgo)) / 1000).toString()
      : null;

  return threeclicksGet(credsPayload, '/search/advanced/shipping', {
    params: {
      mode,
      ...updatedSinceUnix && { last_updated_at_from: updatedSinceUnix },
    },
    ...getterOptions,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  threeclicksShipmentsGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/threeclicksShipmentsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "threeclicks" }
  }'
*/
