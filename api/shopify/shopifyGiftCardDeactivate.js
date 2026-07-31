// https://shopify.dev/docs/api/admin-graphql/latest/mutations/giftCardDeactivate

const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopifyMutationDo');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['giftCardId'],
]);

const shopifyGiftCardDeactivate = async (
  credsPayload,
  giftCardId,
  {
    apiVersion,
    giftCardReturnAttrs = 'id deactivatedAt',
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    giftCardId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return shopifyMutationDo(
    credsPayload,
    'giftCardDeactivate',
    {
      mutationVariables: {
        id: {
          type: 'ID!',
          value: `gid://shopify/GiftCard/${ giftCardId }`,
        },
      },
      returnSchema: `giftCard { ${ giftCardReturnAttrs } }`,
      apiVersion,
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyGiftCardDeactivate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyGiftCardDeactivate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "giftCardId": "651526996040"
  }'
*/
