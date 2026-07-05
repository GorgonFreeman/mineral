// https://loyaltyapi.yotpo.com/reference/create-redemption

const { credsFromPayload, objHasAny, responseIfRejectingArgs } = require('../utils');
const { credsValidator } = require('../validators');
const { yotpoClient } = require('../yotpo/yotpo.utils');

const customerIdentifierValidator = (customerIdentifier) => {
  return objHasAny(customerIdentifier, [
    'customerId',
    'customerEmail',
    'phoneNumber',
    'posAccountId',
  ]);
};

const redemptionOptionIdValidator = Number;

const validatorsByArg = {
  credsPayload: credsValidator,
  customerIdentifier: customerIdentifierValidator,
  redemptionOptionId: redemptionOptionIdValidator,
};

const yotpoRedemptionCreate = async (
  credsPayload,
  customerIdentifier,
  // redemptionOptionId must come from yotpoRedemptionOptionsGet
  redemptionOptionId,
  {
    apiVersion,
    delayPointsDeduction,
    currency,
    pointsToRedeem,
  } = {},
) => {

  const rejectResponse = await responseIfRejectingArgs(validatorsByArg, {
    credsPayload,
    customerIdentifier,
    redemptionOptionId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const creds = await credsFromPayload(credsPayload);

  const {
    customerId,
    customerEmail,
    phoneNumber,
    posAccountId,
  } = customerIdentifier;

  const body = {
    redemption_option_id: Number(redemptionOptionId),
    ...(customerId && { customer_id: customerId }),
    ...(customerEmail && { customer_email: customerEmail }),
    ...(phoneNumber && { phone_number: phoneNumber }),
    ...(posAccountId && { pos_account_id: posAccountId }),
    ...(delayPointsDeduction !== undefined && { delay_points_deduction: delayPointsDeduction }),
    ...(currency && { currency }),
    ...(pointsToRedeem !== undefined && { points_to_redeem: Number(pointsToRedeem) }),
  };

  const response = await yotpoClient.fetch({
    url: '/redemptions',
    method: 'post',
    body,
    context: {
      creds,
      apiVersion,
    },
  });

  return response;
};

const funcApiConfig = {
  argNames: [
    'credsPayload',
    'customerIdentifier',
    'redemptionOptionId',
  ],
  validatorsByArg,
};

module.exports = {
  yotpoRedemptionCreate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/yotpoRedemptionCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "yotpo.au" },
    "customerIdentifier": { "customerEmail": "john@whitefoxboutique.com" },
    "redemptionOptionId": 111111
  }'
*/
