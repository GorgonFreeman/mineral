// https://developers.telnyx.com/api-reference/messages/list-messages

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { telnyxClient } = require('../telnyx/telnyx.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const telnyxMessagesGet = async (
  credsPayload,
  {
    params,
    inspect = false,
    fetchClient = telnyxClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'get',
      url: '/messages',
      params,
    },
    context: { credsPayload },
    inspect,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  telnyxMessagesGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/telnyxMessagesGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "telnyx" }
  }'
*/
