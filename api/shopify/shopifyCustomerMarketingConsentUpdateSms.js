// https://shopify.dev/docs/api/admin-graphql/latest/mutations/customerSmsMarketingConsentUpdate

const { credsValidator } = require('../validators');
const { objHasAny, ArgsWarden } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopifyMutationDo');

const consentPayloadValidator = (consentPayload) => {
  return objHasAny(consentPayload, [
    'consentUpdatedAt',
    'marketingOptInLevel',
    'marketingState',
    'sourceLocationId',
  ]);
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['customerId'],
  ['consentPayload', consentPayloadValidator],
]);

const defaultReturnCustomerAttrs = 'phone smsMarketingConsent { marketingState consentUpdatedAt marketingOptInLevel }';

const shopifyCustomerMarketingConsentUpdateSms = async (
  credsPayload,
  customerId,
  consentPayload,
  {
    apiVersion,
    returnCustomerAttrs = defaultReturnCustomerAttrs,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    customerId,
    consentPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyMutationDo(
    credsPayload,
    'customerSmsMarketingConsentUpdate',
    {
      mutationVariables: {
        input: {
          type: 'CustomerSmsMarketingConsentUpdateInput!',
          value: {
            customerId: `gid://shopify/Customer/${ customerId }`,
            smsMarketingConsent: consentPayload,
          },
        },
      },
      returnSchema: `
        customer { ${ returnCustomerAttrs } }
      `.trim(),
      apiVersion,
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyCustomerMarketingConsentUpdateSms,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyCustomerMarketingConsentUpdateSms" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "customerId": "8575963103304",
    "consentPayload": {
      "marketingState": "UNSUBSCRIBED",
      "marketingOptInLevel": "SINGLE_OPT_IN"
    }
  }'
*/
