// https://shopify.dev/docs/api/storefront/latest/queries/localization

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const {
  shopifyStorefrontClient,
  buildInContextDirective,
} = require('./shopify.utils');

const defaultAttrs = `
  availableCountries {
    isoCode
    name
    currency { isoCode symbol }
  }
  availableLanguages {
    isoCode
    name
    endonymName
  }
  country {
    isoCode
    name
    currency { isoCode symbol }
  }
  language {
    isoCode
    name
  }
  market {
    id
    handle
  }
`.trim();

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const shopifyStorefrontLocalizationGet = async (
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
          query StorefrontLocalization${ inContextDirective } {
            localization {
              ${ attrs }
            }
          }
        `,
      },
    },
    context: {
      credsPayload,
      apiVersion,
      resultPath: 'data.localization',
    },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyStorefrontLocalizationGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontLocalizationGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "options": {
      "inContext": { "country": "AU", "language": "EN" }
    }
  }'
*/
