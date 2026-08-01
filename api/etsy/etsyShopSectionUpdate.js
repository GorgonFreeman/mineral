// https://developers.etsy.com/documentation/reference/#operation/updateShopSection

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyClient, resolveShopId } = require('./etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['shopSectionId'],
  ['updatePayload'],
]);

const etsyShopSectionUpdate = async (
  credsPayload,
  shopSectionId,
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
    shopSectionId,
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
      url: `/application/shops/${ shopId }/sections/${ shopSectionId }`,
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
  etsyShopSectionUpdate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/etsyShopSectionUpdate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": {
      "credsPath": "etsy"
    },
    "shopSectionId": "12345678",
    "updatePayload": {
      ...
    }
  }'
*/
