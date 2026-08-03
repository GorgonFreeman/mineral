// https://developers.gorgias.com/reference/list-messages

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { gorgiasGet, gorgiasGetter } = require('../gorgias/gorgiasGet');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['ticketId'],
]);

const gorgiasTicketMessagesGet = async (
  returnGetter,

  credsPayload,
  ticketId,
  {
    params,
    ...getterOptions
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    ticketId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const getterArgs = [
    credsPayload,
    '/messages',
    {
      params: {
        ticket_id: ticketId,
        ...params,
      },
      ...getterOptions,
    },
  ];

  return returnGetter
    ? gorgiasGetter(...getterArgs)
    : gorgiasGet(...getterArgs);
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  gorgiasTicketMessagesGet: (...args) => gorgiasTicketMessagesGet(false, ...args),
  gorgiasTicketMessagesGetter: (...args) => gorgiasTicketMessagesGet(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/gorgiasTicketMessagesGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "gorgias" },
    "ticketId": "399815746",
    "options": { "limit": 20 }
  }'
*/
