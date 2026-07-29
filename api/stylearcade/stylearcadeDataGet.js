// https://stylearcade.gitlab.io/api-docs/range-plan

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { stylearcadeGet, stylearcadeGetter } = require('../stylearcade/stylearcadeGet');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const stylearcadeDataGet = async (
  credsPayload,
  {
    ...getterOptions
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({ credsPayload });
  if (rejectResponse) {
    return rejectResponse;
  }

  return stylearcadeGet(credsPayload, {
    nodeName: 'records',
    ...getterOptions,
  });
};

const stylearcadeDataGetter = async (
  credsPayload,
  {
    ...getterOptions
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({ credsPayload });
  if (rejectResponse) {
    return rejectResponse;
  }

  return stylearcadeGetter(credsPayload, {
    nodeName: 'records',
    ...getterOptions,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  stylearcadeDataGet,
  stylearcadeDataGetter,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/stylearcadeDataGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "stylearcade" },
    "options": {
      "limit": 2000
    }
  }'
*/
