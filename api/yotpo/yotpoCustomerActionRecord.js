// https://loyaltyapi.yotpo.com/reference/record-a-customer-action

const { objHasAny, ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { yotpoClient } = require('../yotpo/yotpo.utils');

const customerIdentifierValidator = (customerIdentifier) => {
  return objHasAny(customerIdentifier, [
    'customerId',
    'customerEmail',
  ]);
};

const actionNameValidator = Boolean;

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['customerIdentifier', customerIdentifierValidator],
  ['actionName', actionNameValidator],
]);

const yotpoCustomerActionRecord = async (
  credsPayload,
  customerIdentifier,
  actionName,
  {
    apiVersion,
    type = 'CustomAction',
    ipAddress,
    userAgent,
    createdAt,
    rewardPoints,
    historyTitle,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    customerIdentifier,
    actionName,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const {
    customerId,
    customerEmail,
  } = customerIdentifier;

  const body = {
    type,
    action_name: actionName,
    ...(customerId && { customer_id: customerId }),
    ...(customerEmail && { customer_email: customerEmail }),
    ...(ipAddress && { ip_address: ipAddress }),
    ...(userAgent && { user_agent: userAgent }),
    ...(createdAt && { created_at: createdAt }),
    ...(rewardPoints !== undefined && { reward_points: Number(rewardPoints) }),
    ...(historyTitle && { history_title: historyTitle }),
  };

  const response = await yotpoClient.fetch({
    requestPayload: {
      url: '/actions',
      method: 'post',
      body,
    },
    context: {
      credsPayload,
      apiVersion,
    },
  });

  return response;
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  yotpoCustomerActionRecord,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/yotpoCustomerActionRecord" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "yotpo.au" },
    "customerIdentifier": { "customerEmail": "john@whitefoxboutique.com" },
    "actionName": "completed_survey"
  }'
*/
