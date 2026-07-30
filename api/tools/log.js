const { logDeep } = require('../utils');

const log = async (req) => {
  const { headers, body } = req;
  logDeep({ headers, body });
  return { ok: true };
};

const funcApiConfig = {
  passThroughReq: true,
};

module.exports = {
  log,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/log" \
  -H "Content-Type: application/json" \
  -d '{ "patrick": "star" }'
*/
