// https://developers.gorgias.com/reference/list-view-items

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { gorgiasGet, gorgiasGetter } = require('../gorgias/gorgiasGet');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['viewId'],
]);

const gorgiasViewItemsGet = async (
  returnGetter,

  credsPayload,
  viewId,
  getterOptions = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    viewId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const getterArgs = [
    credsPayload,
    `/views/${ viewId }/items`,
    getterOptions,
  ];

  return returnGetter
    ? gorgiasGetter(...getterArgs)
    : gorgiasGet(...getterArgs);
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  gorgiasViewItemsGet: (...args) => gorgiasViewItemsGet(false, ...args),
  gorgiasViewItemsGetter: (...args) => gorgiasViewItemsGet(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/gorgiasViewItemsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "gorgias" },
    "viewId": "2705014",
    "options": { "limit": 10 }
  }'
*/
