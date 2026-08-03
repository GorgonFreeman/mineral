// https://developers.gorgias.com/reference/update-ticket

const { ArgsWarden, valueProvided } = require('../utils');
const { credsValidator } = require('../validators');
const { gorgiasClient } = require('../gorgias/gorgias.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['ticketId'],
  ['ticketBody', valueProvided],
]);

const gorgiasTicketUpdate = async (
  credsPayload,
  ticketId,
  ticketBody,
  {
    inspect = false,
    fetchClient = gorgiasClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    ticketId,
    ticketBody,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'put',
      url: `/tickets/${ ticketId }`,
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
  gorgiasTicketUpdate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/gorgiasTicketUpdate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "gorgias" },
    "ticketId": "399815746",
    "ticketBody": {
      "status": "closed"
    }
  }'
*/
