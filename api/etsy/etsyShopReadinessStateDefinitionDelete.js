// https://developers.etsy.com/documentation/reference/#operation/deleteShopReadinessStateDefinition

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyClient, resolveShopId } = require('./etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['readinessStateDefinitionId'],
]);

const etsyShopReadinessStateDefinitionDelete = async (
  credsPayload,
  readinessStateDefinitionId,
  {
    shopId,
    params,
    inspect = false,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    readinessStateDefinitionId,
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
      method: 'delete',
      url: `/application/shops/${ shopId }/readiness-state-definitions/${ readinessStateDefinitionId }`,
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
  etsyShopReadinessStateDefinitionDelete,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/etsyShopReadinessStateDefinitionDelete" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": {
      "credsPath": "etsy"
    },
    "readinessStateDefinitionId": "123456789"
  }'
*/
