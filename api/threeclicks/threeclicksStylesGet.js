// https://g40-server.instance.3clickscloud.com/swagger-ui/index.html#operations-v1_-_Search_>_Advanced-styleSearch

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { threeclicksGet } = require('../threeclicks/threeclicksGet');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const threeclicksStylesGet = async (
  credsPayload,
  {
    mode = 'all',
    ...getterOptions
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return threeclicksGet(credsPayload, '/search/advanced/style', {
    params: { mode },
    ...getterOptions,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  threeclicksStylesGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/threeclicksStylesGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "threeclicks" }
  }'
*/
