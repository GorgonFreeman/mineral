// https://developers.etsy.com/documentation/reference/#operation/getShippingCarriers

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyClient } = require('./etsy.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const etsyShippingCarriersGet = async (
  credsPayload,
  {
    params,
    inspect = false,
    fetchClient = etsyClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'get',
      url: `/application/shipping-carriers`,
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
  etsyShippingCarriersGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/etsyShippingCarriersGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": {
      "credsPath": "etsy"
    },
    "options": {
      "params": {
        "origin_country_iso": "AU"
      }
    }
  }'
*/
