// https://developers.etsy.com/documentation/reference/#operation/consolidateShopReturnPolicies

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyClient, resolveShopId } = require('./etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['sourceReturnPolicyId'],
  ['destinationReturnPolicyId'],
]);

const etsyShopReturnPoliciesConsolidate = async (
  credsPayload,
  sourceReturnPolicyId,
  destinationReturnPolicyId,
  {
    shopId,
    inspect = false,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    sourceReturnPolicyId,
    destinationReturnPolicyId,
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
      method: 'post',
      url: `/application/shops/${ shopId }/policies/return/consolidate`,
      body: {
        source_return_policy_id: sourceReturnPolicyId,
        destination_return_policy_id: destinationReturnPolicyId,
      },
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
  etsyShopReturnPoliciesConsolidate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/etsyShopReturnPoliciesConsolidate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": {
      "credsPath": "etsy"
    },
    "sourceReturnPolicyId": "123456789",
    "destinationReturnPolicyId": "987654321"
  }'
*/
