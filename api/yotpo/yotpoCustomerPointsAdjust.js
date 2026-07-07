// https://loyaltyapi.yotpo.com/reference/adjust-a-customers-point-balance

const { credsFromPayload, objHasAny, ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { yotpoClient } = require('../yotpo/yotpo.utils');

const customerIdentifierValidator = (customerIdentifier) => {
  return objHasAny(customerIdentifier, [
    'customerId', 
    'customerEmail',
  ]);
};

const pointsAmountValidator = Number;

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['customerIdentifier', customerIdentifierValidator],
  ['pointsAmount', pointsAmountValidator],
]);

const yotpoCustomerPointsAdjust = async (
  credsPayload,
  customerIdentifier,
  pointsAmount,
  {
    apiVersion,
    applyAdjustmentToPointsEarned,
    historyTitle,
    visibleToCustomer = true,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    customerIdentifier,
    pointsAmount,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const creds = await credsFromPayload(credsPayload);

  const {
    customerId,
    customerEmail,
  } = customerIdentifier;

  const body = {
    point_adjustment_amount: Number(pointsAmount),
    ...(customerId && { customer_id: customerId }),
    ...(customerEmail && { customer_email: customerEmail }),
    ...(historyTitle && { history_title: historyTitle }),
    ...(applyAdjustmentToPointsEarned !== undefined && { apply_adjustment_to_points_earned: applyAdjustmentToPointsEarned }),
    visible_to_customer: visibleToCustomer,
  };

  const response = await yotpoClient.fetch({
    url: '/points/adjust',
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
  argsWarden,
};

module.exports = {
  yotpoCustomerPointsAdjust,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/yotpoCustomerPointsAdjust" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "yotpo.au" },
    "customerIdentifier": { "customerEmail": "john@whitefoxboutique.com" },
    "pointsAmount": 100
  }'
*/
