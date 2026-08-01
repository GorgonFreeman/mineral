// https://developers.telnyx.com/api-reference/messages/retrieve-a-message

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { telnyxClient } = require('../telnyx/telnyx.utils');

const idValidator = (id) => typeof id === 'string' && id.length > 0;

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['messageId', idValidator],
]);

const telnyxMessageGet = async (
  credsPayload,
  messageId,
  {
    params,
    inspect = false,
    fetchClient = telnyxClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    messageId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'get',
      url: `/messages/${ messageId }`,
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
  telnyxMessageGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/telnyxMessageGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "telnyx" },
    "messageId": "00000000-0000-0000-0000-000000000000"
  }'
*/
