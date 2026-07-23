// https://workable.readme.io/reference/job-stages

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { workableClient } = require('../workable/workable.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['shortcode'],
]);

const workableJobStagesGet = async (
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
      url: `/jobs/${ shortcode }/stages`,
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
  workableJobStagesGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/workableJobStagesGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "workable" },
    "shortcode": "RKT001"
  }'
*/
