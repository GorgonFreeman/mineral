// https://workable.readme.io/reference/job-candidates-create

const { credsFromPayload, ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { workableClient } = require('../workable/workable.utils');

const candidateValidator = (candidate) => {
  return Boolean(candidate) && typeof candidate === 'object';
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['shortcode'],
  ['candidate', candidateValidator],
]);

const workableJobCandidateCreate = async (
  credsPayload,
  shortcode,
  candidate,
  {
    stage,
    sourced = true,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    shortcode,
    candidate,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const creds = await credsFromPayload(credsPayload);

  return workableClient.fetch({
    url: `/jobs/${ shortcode }/candidates`,
    method: 'post',
    body: {
      sourced,
      ...stage !== undefined && { stage },
      candidate,
    },
    context: {
      creds,
    },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  workableJobCandidateCreate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/workableJobCandidateCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "workable" },
    "shortcode": "RKT001",
    "candidate": {
      "name": "Jessie",
      "email": "jessie@teamrocket.org"
    }
  }'

curl -X POST "http://localhost:8000/workableJobCandidateCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "workable" },
    "shortcode": "RKT001",
    "candidate": {
      "name": "James",
      "email": "james@teamrocket.org"
    },
    "options": {
      "sourced": false,
      "stage": "applied"
    }
  }'
*/
