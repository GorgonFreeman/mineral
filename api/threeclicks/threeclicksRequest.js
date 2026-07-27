// https://access.3clickscloud.com/apiuserguide.php

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { threeclicksClient } = require('../threeclicks/threeclicks.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['url'],
]);

const threeclicksRequest = async (
  credsPayload,
  url,
  {
    method = 'get',
    params,
    body,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    url,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return threeclicksClient.fetch({
    requestPayload: {
      url,
      method,
      ...params && { params },
      ...body && { body },
    },
    context: {
      credsPayload,
    },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  threeclicksRequest,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/threeclicksRequest" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "threeclicks" },
    "url": "/style/basic/EXDAL355-10",
    "options": {
      "method": "get"
    }
  }'
*/
