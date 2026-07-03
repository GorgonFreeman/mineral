// https://shopify.dev/docs/api/admin-graphql/latest/mutations/giftCardCreate

const { credsValidator } = require('../validators');
const { responseIfRejectingArgs } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopifyMutationDo');

const giftCardInputValidator = (giftCardInput) => {
  if (!giftCardInput || typeof giftCardInput !== 'object') {
    return false;
  }

  const initialValue = parseFloat(giftCardInput.initialValue);
  return !isNaN(initialValue) && initialValue > 0;
};

const validatorsByArg = {
  credsPayload: credsValidator,
  giftCardInput: giftCardInputValidator,
};

const defaultReturnGiftCardAttrs = 'id initialValue { amount } customer { id }';

const shopifyGiftCardCreate = async (
  credsPayload,
  giftCardInput,
  {
    apiVersion,
    returnGiftCardAttrs = defaultReturnGiftCardAttrs,
  } = {},
) => {

  const rejectResponse = await responseIfRejectingArgs(validatorsByArg, { credsPayload, giftCardInput });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyMutationDo(
    credsPayload,
    'giftCardCreate',
    {
      mutationVariables: {
        input: {
          type: 'GiftCardCreateInput!',
          value: giftCardInput,
        },
      },
      returnSchema: `
        giftCardCode
        giftCard { ${ returnGiftCardAttrs } }
      `.trim(),
      apiVersion,
    },
  );
};

const funcApiConfig = {
  argNames: ['credsPayload', 'giftCardInput'],
  validatorsByArg,
};

module.exports = {
  shopifyGiftCardCreate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyGiftCardCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "giftCardInput": {
      "initialValue": "5",
      "customerId": "gid://shopify/Customer/1234567890",
      "note": "Pocket money"
    }
  }'

curl -X POST "http://localhost:8000/shopifyGiftCardCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "giftCardInput": {
      "initialValue": "101.0",
      "customerId": "gid://shopify/Customer/1234567890",
      "recipientAttributes": {
        "id": "gid://shopify/Customer/0987654321",
        "message": "One dalmatian = one dollar",
        "preferredName": "Cruella",
        "sendNotificationAt": "2026-07-01T12:00:00Z"
      }
    },
    "options": {
      "returnGiftCardAttrs": "id initialValue { amount } customer { id } recipientAttributes { message preferredName sendNotificationAt recipient { id } }"
    }
  }'
*/
