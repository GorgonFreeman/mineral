// https://developers.etsy.com/documentation/reference/#operation/getPropertiesByBuyerTaxonomyId

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyClient } = require('./etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['taxonomyId'],
]);

const etsyBuyerTaxonomyNodePropertiesGet = async (
  credsPayload,
  taxonomyId,
  {
    params,
    inspect = false,
    fetchClient = etsyClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    taxonomyId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'get',
      url: `/application/buyer-taxonomy/nodes/${ taxonomyId }/properties`,
      ...(params && { params }),
    },
    context: {
      credsPayload,
      withAccessToken: false,
    },
    inspect,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  etsyBuyerTaxonomyNodePropertiesGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/etsyBuyerTaxonomyNodePropertiesGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": {
      "credsPath": "etsy"
    },
    "taxonomyId": "1"
  }'
*/
