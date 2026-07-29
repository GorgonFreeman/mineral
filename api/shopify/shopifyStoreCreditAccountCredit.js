// https://shopify.dev/docs/api/admin-graphql/latest/mutations/storeCreditAccountCredit

const { credsValidator } = require('../validators');
const { actionSingleOrMultiple, everyIfArray, ArgsWarden } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopifyMutationDo');

const creditAmountValidator = (creditAmount) => {
  return creditAmount?.amount !== undefined
    && creditAmount?.amount !== null
    && creditAmount?.currencyCode;
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['ownerOrAccountGid'],
  ['creditAmount', (i) => everyIfArray(creditAmountValidator, i)],
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
  creditAmount,
  {
    apiVersion,
    expiresAt,
    returnSchema = defaultReturnSchema,
  } = {},
) => {

  const {
    amount,
    currencyCode,
  } = creditAmount;

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
  creditAmount,
  {
    queueRunOptions,
    apiVersion,
    expiresAt,
    returnSchema = defaultReturnSchema,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    ownerOrAccountGid,
    creditAmount,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return actionSingleOrMultiple(
    creditAmount,
    shopifyStoreCreditAccountCreditSingle,
    (creditAmountItem) => ({
      args: [
        credsPayload,
        ownerOrAccountGid,
        creditAmountItem,
        { apiVersion, expiresAt, returnSchema },
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
    "creditAmount": {
      "amount": "10.00",
      "currencyCode": "AUD"
    }
  }'

curl -X POST "http://localhost:8000/shopifyStoreCreditAccountCredit" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "ownerOrAccountGid": "gid://shopify/Customer/5736896757832",
    "creditAmount": [
      { "amount": "10.00", "currencyCode": "AUD" },
      { "amount": "5.00", "currencyCode": "USD" }
    ]
  }'
*/
