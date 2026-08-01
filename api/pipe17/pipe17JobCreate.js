// https://apidoc.pipe17.com/#/operations/createJob

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { pipe17Client } = require('../pipe17/pipe17.utils');
const { JOB_TYPES, JOB_SUBTYPES } = require('../pipe17/pipe17.constants');

const jobTypeValidator = (type) => JOB_TYPES.includes(type);
const jobSubTypeValidator = (subType) => JOB_SUBTYPES.includes(subType);

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['type', jobTypeValidator],
  ['subType', jobSubTypeValidator],
]);

const pipe17JobCreate = async (
  credsPayload,
  type,
  subType,
  {
    contentType,
    internal,
    params,
    state,
    tags,
    timeout,
    inspect = false,
    fetchClient = pipe17Client,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    type,
    subType,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const response = await fetchClient.fetch({
    requestPayload: {
      method: 'post',
      url: '/jobs',
      body: {
        type,
        subType,
        ...contentType && { contentType },
        ...internal && { internal },
        ...params && { params },
        ...state && { state },
        ...tags && { tags },
        ...timeout && { timeout },
      },
    },
    context: { credsPayload },
    inspect,
  });

  if (!response.ok) {
    return response;
  }

  const job = response.data?.result?.job
    ?? response.data?.job;
  if (job !== undefined) {
    return {
      ...response,
      data: job,
    };
  }

  return response;
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  pipe17JobCreate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/pipe17JobCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "pipe17" },
    "type": "report",
    "subType": "orders",
    "options": { "params": { "emails": ["test@example.com"] } }
  }'
*/
