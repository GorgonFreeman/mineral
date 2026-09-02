// https://developer.salesforce.com/docs/marketing/marketing-cloud/references/mc_rest_contacts/getContact.html

const { ArgsWarden, actionSingleOrMultiple } = require('../utils');
const { credsValidator } = require('../validators');
const { marketingcloudClient } = require('../marketingcloud/marketingcloud.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['contactKey'],
]);

const marketingcloudContactGetSingle = async (
  credsPayload,
  contactKey,
  {
    inspect = false,
    fetchClient = marketingcloudClient,
  } = {},
) => {

  return fetchClient.fetch({
    requestPayload: {
      method: 'get',
      url: `/contacts/v1/contacts/${ encodeURIComponent(contactKey) }`,
    },
    context: {
      credsPayload,
    },
    inspect,
  });
};

const marketingcloudContactGet = async (
  credsPayload,
  contactKey,
  {
    queueRunOptions,
    ...options
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    contactKey,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return actionSingleOrMultiple(
    contactKey,
    marketingcloudContactGetSingle,
    (contactKeyItem) => ({
      args: [credsPayload, contactKeyItem, options],
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  marketingcloudContactGet,
  marketingcloudContactGetSingle,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/marketingcloudContactGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "marketingcloud" },
    "contactKey": "1234567890"
  }'
*/
