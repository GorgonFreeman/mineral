const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { BASE_URL } = require('../bleckmann/bleckmann.constants');
const { bleckmannClient } = require('../bleckmann/bleckmann.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['asnId'],
]);

const bleckmannAsnGet = async (
  credsPayload,
  asnId,
  options = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    asnId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const response = await bleckmannClient.fetch({
    requestPayload: {
      url: `/warehousing/asns/${ asnId }`,
    },
    context: {
      credsPayload,
      baseUrl: BASE_URL,
    },
  });

  return response;
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  bleckmannAsnGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/bleckmannAsnGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "bleckmann" },
    "asnId": "UK-AG002594"
  }'
*/
