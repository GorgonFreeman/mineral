// https://developers.gorgias.com/reference/list-views

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { gorgiasClient } = require('../gorgias/gorgias.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const normalizeViewsList = (body) => {
  if (Array.isArray(body)) {
    return body;
  }

  if (Array.isArray(body?.data)) {
    return body.data;
  }

  return [];
};

const gorgiasViewsGet = async (
  credsPayload,
  {
    inspect = false,
    fetchClient = gorgiasClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const response = await fetchClient.fetch({
    requestPayload: {
      method: 'get',
      url: '/views',
    },
    context: { credsPayload },
    inspect,
  });

  if (!response.ok) {
    return response;
  }

  return {
    ok: true,
    data: normalizeViewsList(response.data),
  };
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  gorgiasViewsGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/gorgiasViewsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "gorgias" }
  }'
*/
