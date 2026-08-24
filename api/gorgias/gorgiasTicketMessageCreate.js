// https://developers.gorgias.com/reference/create-ticket-message

const { ArgsWarden, valueProvided } = require('../utils');
const { credsValidator } = require('../validators');
const { gorgiasClient } = require('../gorgias/gorgias.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['ticketId'],
  ['messageBody'],
]);

const gorgiasTicketMessageCreate = async (
  credsPayload,
  ticketId,
  messageBody,
  {
    inspect = false,
    fetchClient = gorgiasClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    ticketId,
    messageBody,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'post',
      url: `/tickets/${ ticketId }/messages`,
      body: messageBody,
    },
    context: { credsPayload },
    inspect,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  gorgiasTicketMessageCreate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/gorgiasTicketMessageCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "gorgias" },
    "ticketId": "399815746",
    "messageBody": {
      "channel": "email",
      "via": "api",
      "from_agent": true,
      "body_text": "Thanks for reaching out — we are looking into this."
    }
  }'
*/
