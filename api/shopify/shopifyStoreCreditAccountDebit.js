// https://shopify.dev/docs/api/admin-graphql/latest/mutations/storeCreditAccountDebit

const { credsValidator } = require('../validators');
const { actionSingleOrMultiple, everyIfArray, ArgsWarden } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopifyMutationDo');

const debitAmountValidator = (debitAmount) => {
  return debitAmount?.amount !== undefined
    && debitAmount?.amount !== null
    && debitAmount?.currencyCode;
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['ownerOrAccountGid'],
  ['debitAmount', (i) => everyIfArray(debitAmountValidator, i)],
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

const shopifyStoreCreditAccountDebitSingle = async (
  credsPayload,
  ownerOrAccountGid,
  debitAmount,
  {
    apiVersion,
    returnSchema = defaultReturnSchema,
  } = {},
) => {

  const {
    amount,
    currencyCode,
  } = debitAmount;

  return shopifyMutationDo(
    credsPayload,
    'storeCreditAccountDebit',
    {
      mutationVariables: {
        id: {
          type: 'ID!',
          value: ownerOrAccountGid,
        },
        debitInput: {
          type: 'StoreCreditAccountDebitInput!',
          value: {
            debitAmount: {
              amount: String(amount),
              currencyCode,
            },
          },
        },
      },
      returnSchema,
      apiVersion,
    },
  );
};

const shopifyStoreCreditAccountDebit = async (
  credsPayload,
  ownerOrAccountGid,
  debitAmount,
  {
    queueRunOptions,
    apiVersion,
    returnSchema = defaultReturnSchema,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    ownerOrAccountGid,
    debitAmount,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return actionSingleOrMultiple(
    debitAmount,
    shopifyStoreCreditAccountDebitSingle,
    (debitAmountItem) => ({
      args: [
        credsPayload,
        ownerOrAccountGid,
        debitAmountItem,
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
  shopifyStoreCreditAccountDebit,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStoreCreditAccountDebit" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "ownerOrAccountGid": "gid://shopify/StoreCreditAccount/11862088",
    "debitAmount": {
      "amount": "10.00",
      "currencyCode": "AUD"
    }
  }'
*/
