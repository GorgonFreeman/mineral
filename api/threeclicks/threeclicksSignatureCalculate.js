// https://access.3clickscloud.com/apiuserguide.php

const { ArgsWarden, credsFromPayload } = require('../utils');
const { credsValidator } = require('../validators');
const {
  threeclicksSignatureCalculate,
  getSignatureData,
} = require('../threeclicks/threeclicks.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['method'],
]);

const threeclicksSignatureCalculateEndpoint = async (
  credsPayload,
  method,
  {
    params,
    body,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    method,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const creds = await credsFromPayload(credsPayload);
  const normalizedMethod = method.toLowerCase();
  const data = getSignatureData({
    method: normalizedMethod,
    params,
    body,
  });

  const result = threeclicksSignatureCalculate({
    creds,
    method: normalizedMethod,
    data,
  });

  return {
    ok: true,
    data: result,
  };
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  threeclicksSignatureCalculate: threeclicksSignatureCalculateEndpoint,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/threeclicksSignatureCalculate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "threeclicks" },
    "method": "get",
    "options": {
      "params": {
        "hey": "true"
      }
    }
  }'
*/
