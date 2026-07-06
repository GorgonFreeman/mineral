// https://shopify.dev/docs/api/admin-graphql/latest/mutations/customeremailmarketingconsentupdate

const { credsValidator } = require('../validators');
const { responseIfRejectingArgs, objHasAny } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopifyMutationDo');

const consentPayloadValidator = (consentPayload) => {
  return objHasAny(consentPayload, [
    'consentUpdatedAt',
    'marketingOptInLevel',
    'marketingState',
    'sourceLocationId',
  ]);
};

const validatorsByArg = {
  credsPayload: credsValidator,
  customerId: Boolean,
  consentPayload: consentPayloadValidator,
};

const defaultReturnCustomerAttrs = 'email emailMarketingConsent { marketingState consentUpdatedAt marketingOptInLevel }';

const shopifyCustomerMarketingConsentUpdateEmail = async (
  credsPayload,
  customerId,
  consentPayload,
  {
    apiVersion,
    returnCustomerAttrs = defaultReturnCustomerAttrs,
  } = {},
) => {

  const rejectResponse = await responseIfRejectingArgs(validatorsByArg, {
    credsPayload,
    customerId,
    consentPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyMutationDo(
    credsPayload,
    'customerEmailMarketingConsentUpdate',
    {
      mutationVariables: {
        input: {
          type: 'CustomerEmailMarketingConsentUpdateInput!',
          value: {
            customerId: `gid://shopify/Customer/${ customerId }`,
            emailMarketingConsent: consentPayload,
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
  argNames: [
    'credsPayload',
    'customerId',
    'consentPayload',
  ],
  validatorsByArg,
};

module.exports = {
  shopifyCustomerMarketingConsentUpdateEmail,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyCustomerMarketingConsentUpdateEmail" \
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
