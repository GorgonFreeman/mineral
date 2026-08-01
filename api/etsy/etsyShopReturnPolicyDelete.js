// https://developers.etsy.com/documentation/reference/#operation/deleteShopReturnPolicy

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyClient, resolveShopId } = require('./etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['returnPolicyId'],
]);

const etsyShopReturnPolicyDelete = async (
  credsPayload,
  returnPolicyId,
  {
    shopId,
    params,
    inspect = false,
    fetchClient = etsyClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    returnPolicyId,
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
      method: 'delete',
      url: `/application/shops/${ shopId }/policies/return/${ returnPolicyId }`,
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
  etsyShopReturnPolicyDelete,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/etsyShopReturnPolicyDelete" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": {
      "credsPath": "etsy"
    },
    "returnPolicyId": "123456789"
  }'
*/
