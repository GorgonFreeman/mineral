// https://workable.readme.io/reference/jobs

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { workableGet } = require('../workable/workableGet');
const { MAX_PER_PAGE } = require('../workable/workable.constants');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const workableJobsGet = async (
  credsPayload,
  {
    state,
    sinceId,
    maxId,
    createdAfter,
    updatedAfter,
    includeFields,
    perPage,
    ...getterOptions
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({ credsPayload });
  if (rejectResponse) {
    return rejectResponse;
  }

  const normalisedIncludeFields = Array.isArray(includeFields)
    ? includeFields.join(',')
    : includeFields;

  const params = {
    ...state !== undefined && { state },
    ...sinceId !== undefined && { since_id: sinceId },
    ...maxId !== undefined && { max_id: maxId },
    ...createdAfter !== undefined && { created_after: createdAfter },
    ...updatedAfter !== undefined && { updated_after: updatedAfter },
    ...normalisedIncludeFields !== undefined && { include_fields: normalisedIncludeFields },
  };

  return workableGet(credsPayload, '/jobs', {
    params,
    perPage: perPage ?? MAX_PER_PAGE,
    resultsKey: 'jobs',
    ...getterOptions,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  workableJobsGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/workableJobsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "workable" }
  }'

curl -X POST "http://localhost:8000/workableJobsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "workable" },
    "options": {
      "state": "published",
      "perPage": 10,
      "includeFields": ["description", "requirements"]
    }
  }'
*/
