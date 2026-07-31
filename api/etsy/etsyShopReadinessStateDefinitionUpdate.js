// https://developers.etsy.com/documentation/reference/#operation/updateShopReadinessStateDefinition

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyClient, resolveShopId } = require('./etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['readinessStateDefinitionId'],
  ['updatePayload'],
]);

const etsyShopReadinessStateDefinitionUpdate = async (
  credsPayload,
  readinessStateDefinitionId,
  updatePayload,
  {
    shopId,
    params,
    inspect = false,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    readinessStateDefinitionId,
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

  return etsyClient.fetch({
    requestPayload: {
      method: 'put',
      url: `/application/shops/${ shopId }/readiness-state-definitions/${ readinessStateDefinitionId }`,
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
  etsyShopReadinessStateDefinitionUpdate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/etsyShopReadinessStateDefinitionUpdate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": {
      "credsPath": "etsy"
    },
    "readinessStateDefinitionId": "123456789",
    "updatePayload": {
      ...
    }
  }'
*/
