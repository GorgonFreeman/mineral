// https://shopify.dev/docs/api/admin-graphql/latest/mutations/storeCreditAccountCredit

const { credsValidator } = require('../validators');
const { actionSingleOrMultiple, everyIfArray, ArgsWarden, valueProvided } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopifyMutationDo');

const creditPayloadValidator = (creditPayload) => {
  return valueProvided(creditPayload?.amount)
    && creditPayload?.currencyCode;
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['ownerOrAccountGid'],
  ['creditPayload', (i) => everyIfArray(creditPayloadValidator, i)],
]);

const defaultReturnSchema = `
  storeCreditAccountTransaction {
    amount {
      amount
      currencyCode
    }
    account {
      id
      balance {
        amount
        currencyCode
      }
    }
  }
`.trim();

const shopifyStoreCreditAccountCreditSingle = async (
  credsPayload,
  ownerOrAccountGid,
  creditPayload,
  {
    apiVersion,
    returnSchema = defaultReturnSchema,
  } = {},
) => {

  const {
    amount,
    currencyCode,
    expiresAt,
  } = creditPayload;

  return shopifyMutationDo(
    credsPayload,
    'storeCreditAccountCredit',
    {
      mutationVariables: {
        id: {
          type: 'ID!',
          value: ownerOrAccountGid,
        },
        creditInput: {
          type: 'StoreCreditAccountCreditInput!',
          value: {
            creditAmount: {
              amount: String(amount),
              currencyCode,
            },
            ...(expiresAt && { expiresAt }),
          },
        },
      },
      returnSchema,
      apiVersion,
    },
  );
};

const shopifyStoreCreditAccountCredit = async (
  credsPayload,
  ownerOrAccountGid,
  creditPayload,
  {
    queueRunOptions,
    apiVersion,
    returnSchema = defaultReturnSchema,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    ownerOrAccountGid,
    creditPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return actionSingleOrMultiple(
    creditPayload,
    shopifyStoreCreditAccountCreditSingle,
    (creditPayloadItem) => ({
      args: [
        credsPayload,
        ownerOrAccountGid,
        creditPayloadItem,
        { apiVersion, returnSchema },
      ],
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyStoreCreditAccountCredit,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStoreCreditAccountCredit" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "ownerOrAccountGid": "gid://shopify/Customer/5736896757832",
    "creditPayload": {
      "amount": "10.00",
      "currencyCode": "AUD"
    }
  }'

curl -X POST "http://localhost:8000/shopifyStoreCreditAccountCredit" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "ownerOrAccountGid": "gid://shopify/Customer/5736896757832",
    "creditPayload": [
      { "amount": "10.00", "currencyCode": "AUD", "expiresAt": "2027-07-16T13:59:59Z" },
      { "amount": "5.00", "currencyCode": "USD" }
    ]
  }'
*/
