// https://developers.etsy.com/documentation/reference/#operation/updateHolidayPreferences

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyClient, resolveShopId } = require('./etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['holidayId'],
  ['updatePayload'],
]);

const etsyHolidayPreferencesUpdate = async (
  credsPayload,
  holidayId,
  updatePayload,
  {
    shopId,
    params,
    inspect = false,
    fetchClient = etsyClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    holidayId,
    updatePayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const shopIdResponse = await resolveShopId({ shopId, credsPayload });
  if (!shopIdResponse.ok) {
    return shopIdResponse;
  }
  ({ data: shopId } = shopIdResponse);

  return fetchClient.fetch({
    requestPayload: {
      method: 'put',
      url: `/application/shops/${ shopId }/holiday-preferences/${ holidayId }`,
      body: updatePayload,
    },
    context: {
      credsPayload,
      withAccessToken: true,
    },
    inspect,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  etsyHolidayPreferencesUpdate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/etsyHolidayPreferencesUpdate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": {
      "credsPath": "etsy"
    },
    "holidayId": "123456789",
    "updatePayload": {
      ...
    }
  }'
*/
