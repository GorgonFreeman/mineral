// https://shopify.dev/docs/api/storefront/latest/queries/paymentSettings

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const {
  shopifyStorefrontClient,
  buildInContextDirective,
} = require('./shopify.utils');

const defaultAttrs = `
  acceptedCardBrands
  cardVaultUrl
  countryCode
  currencyCode
  enabledPresentmentCurrencies
  shopifyPaymentsAccountId
  supportedDigitalWallets
`.trim();

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const shopifyStorefrontPaymentSettingsGet = async (
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
          query StorefrontPaymentSettings${ inContextDirective } {
            paymentSettings {
              ${ attrs }
            }
          }
        `,
      },
    },
    context: {
      credsPayload,
      apiVersion,
      resultPath: 'data.paymentSettings',
    },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyStorefrontPaymentSettingsGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontPaymentSettingsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" }
  }'
*/
