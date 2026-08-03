// https://developers.gorgias.com/reference/get-ticket

const { ArgsWarden, actionSingleOrMultiple } = require('../utils');
const { credsValidator } = require('../validators');
const { gorgiasGetSingle } = require('../gorgias/gorgiasGetSingle');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['ticketId'],
]);

const gorgiasTicketGetSingle = async (
  credsPayload,
  ticketId,
  options = {},
) => {
  return gorgiasGetSingle(
    credsPayload,
    '/tickets',
    ticketId,
    options,
  );
};

const gorgiasTicketGet = async (
  credsPayload,
  ticketId,
  {
    queueRunOptions,
    ...options
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    ticketId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return actionSingleOrMultiple(
    ticketId,
    gorgiasTicketGetSingle,
    (ticketIdItem) => ({
      args: [credsPayload, ticketIdItem, options],
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
  gorgiasTicketGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/gorgiasTicketGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "gorgias" },
    "ticketId": "399815746"
  }'
*/
