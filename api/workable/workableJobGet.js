// https://workable.readme.io/reference/jobsshortcode

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { workableClient } = require('../workable/workable.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['shortcode'],
]);

const workableJobGet = async (
  credsPayload,
  shortcode,
  options = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    shortcode,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return workableClient.fetch({
    requestPayload: {
      url: `/jobs/${ shortcode }`,
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
  workableJobGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/workableJobGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "workable" },
    "shortcode": "RKT001"
  }'
*/
