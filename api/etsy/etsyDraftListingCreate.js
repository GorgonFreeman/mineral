// https://developers.etsy.com/documentation/reference/#operation/createDraftListing

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyClient, resolveShopId } = require('./etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['createPayload'],
]);

const etsyDraftListingCreate = async (
  credsPayload,
  createPayload,
  {
    shopId,
    params,
    inspect = false,
    fetchClient = etsyClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    createPayload,
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
      method: 'post',
      url: `/application/shops/${ shopId }/listings`,
      body: createPayload,
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
  etsyDraftListingCreate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/etsyDraftListingCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": {
      "credsPath": "etsy"
    },
    "createPayload": {
      ...
    }
  }'
*/
