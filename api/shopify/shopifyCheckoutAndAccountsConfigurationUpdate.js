// https://shopify.dev/docs/api/admin-graphql/latest/mutations/checkoutAndAccountsConfigurationUpdate

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopifyMutationDo');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['configurationId'],
  ['updatePayload'],
]);

const defaultReturnConfigurationAttrs = 'id name isPublished updatedAt';

const shopifyCheckoutAndAccountsConfigurationUpdate = async (
  credsPayload,
  configurationId,
  updatePayload,
  {
    apiVersion,
    returnConfigurationAttrs = defaultReturnConfigurationAttrs,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    configurationId,
    updatePayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyMutationDo(
    credsPayload,
    'checkoutAndAccountsConfigurationUpdate',
    {
      mutationVariables: {
        id: {
          type: 'ID!',
          value: `gid://shopify/CheckoutAndAccountsConfiguration/${ configurationId }`,
        },
        configuration: {
          type: 'CheckoutAndAccountsConfigurationInput!',
          value: updatePayload,
        },
      },
      returnSchema: `configuration { ${ returnConfigurationAttrs } }`,
      apiVersion,
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyCheckoutAndAccountsConfigurationUpdate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyCheckoutAndAccountsConfigurationUpdate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "configurationId": "123456789",
    "updatePayload": {
      "branding": {
        "designTokens": {
          "cornerRadius": {
            "large": "LARGE"
          }
        }
      }
    }
  }'
*/
