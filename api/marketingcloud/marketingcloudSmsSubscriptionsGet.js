// https://developer.salesforce.com/docs/marketing/marketing-cloud/references/mc_rest_sms/contactsSubscriptions.html

const { ArgsWarden, ensureArray, objHasAny } = require('../utils');
const { credsValidator } = require('../validators');
const { marketingcloudClient } = require('../marketingcloud/marketingcloud.utils');

const subscriptionsValidator = (subscriptions) => {
  return objHasAny(subscriptions, ['mobileNumber', 'subscriberKey']);
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['subscriptions', subscriptionsValidator],
]);

const marketingcloudSmsSubscriptionsGet = async (
  credsPayload,
  subscriptions,
  {
    inspect = false,
    fetchClient = marketingcloudClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    subscriptions,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const {
    mobileNumber,
    subscriberKey,
  } = subscriptions;

  const body = {};

  if (mobileNumber) {
    body.mobileNumber = ensureArray(mobileNumber);
  }

  if (subscriberKey) {
    body.subscriberKey = ensureArray(subscriberKey);
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'post',
      url: '/sms/v1/contacts/subscriptions',
      body,
    },
    context: {
      credsPayload,
    },
    inspect,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  marketingcloudSmsSubscriptionsGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/marketingcloudSmsSubscriptionsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "marketingcloud" },
    "subscriptions": {
      "mobileNumber": ["61412345678", "61498765432"]
    }
  }'
*/
