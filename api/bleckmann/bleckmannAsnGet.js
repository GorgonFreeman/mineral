const { credsValidator } = require('../validators');
const { ArgsWarden, FetchClientV2 } = require('../utils');

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

  const bleckmannFetchClient = new FetchClientV2();
  const response = await bleckmannFetchClient.fetch({
    requestPayload: {
      url: `/warehousing/asns/${ asnId }`,
    },
    context: {
      credsPayload,
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
