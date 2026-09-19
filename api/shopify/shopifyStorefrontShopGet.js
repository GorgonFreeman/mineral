// https://shopify.dev/docs/api/storefront/latest/queries/shop

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const {
  shopifyStorefrontClient,
  buildInContextDirective,
} = require('./shopify.utils');

const defaultAttrs = `
  id
  name
  description
  primaryDomain { url host }
  moneyFormat
  paymentSettings {
    currencyCode
    acceptedCardBrands
  }
`.trim();

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const shopifyStorefrontShopGet = async (
  credsPayload,
  {
    apiVersion,
    attrs = defaultAttrs,
    inContext,
    fetchClient = shopifyStorefrontClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const inContextDirective = buildInContextDirective(inContext);

  return fetchClient.fetch({
    requestPayload: {
      method: 'post',
      body: {
        query: `
          query StorefrontShop${ inContextDirective } {
            shop {
              ${ attrs }
            }
          }
        `,
      },
    },
    context: {
      credsPayload,
      apiVersion,
      resultPath: 'data.shop',
    },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyStorefrontShopGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontShopGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" }
  }'
*/
