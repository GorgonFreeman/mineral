// https://developers.gorgias.com/reference/create-ticket

const { ArgsWarden, valueProvided } = require('../utils');
const { credsValidator } = require('../validators');
const { gorgiasClient } = require('../gorgias/gorgias.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['ticketBody'],
]);

const gorgiasTicketCreate = async (
  credsPayload,
  ticketBody,
  {
    inspect = false,
    fetchClient = gorgiasClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    ticketBody,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'post',
      url: '/tickets',
      body: ticketBody,
    },
    context: { credsPayload },
    inspect,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  gorgiasTicketCreate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/gorgiasTicketCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "gorgias" },
    "ticketBody": {
      "customer": { "email": "customer@example.com" },
      "messages": [
        {
          "channel": "email",
          "via": "email",
          "from_agent": false,
          "body_text": "Hello"
        }
      ]
    }
  }'
*/
