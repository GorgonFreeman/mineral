// https://shopify.dev/docs/api/storefront/latest/queries/customer

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const {
  shopifyStorefrontClient,
  buildInContextDirective,
} = require('./shopify.utils');

const defaultAttrs = `
  id
  firstName
  lastName
  displayName
  email
  phone
  acceptsMarketing
  createdAt
  updatedAt
  defaultAddress {
    id
    address1
    city
    country
  }
`.trim();

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['customerAccessToken'],
]);

const shopifyStorefrontCustomerGet = async (
  credsPayload,
  customerAccessToken,
  {
    apiVersion,
    attrs = defaultAttrs,
    inContext,
    fetchClient = shopifyStorefrontClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    customerAccessToken,
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
          query StorefrontCustomer ($customerAccessToken: String!)${ inContextDirective } {
            customer(customerAccessToken: $customerAccessToken) {
              ${ attrs }
            }
          }
        `,
        variables: { customerAccessToken },
      },
    },
    context: {
      credsPayload,
      apiVersion,
      resultPath: 'data.customer',
    },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyStorefrontCustomerGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontCustomerGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "customerAccessToken": "shcat_xxx"
  }'
*/
