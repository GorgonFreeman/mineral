// https://shopify.dev/docs/api/admin-graphql/latest/queries/customer

const { credsValidator } = require('../validators');
const { objHasAny, credsFromPayload, ArgsWarden } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');
const { shopifyClient } = require('../shopify/shopify.utils');

const defaultAttrs = 'id email';

const customerIdentifierValidator = (customerIdentifier) => {
  return objHasAny(customerIdentifier, [
    'customerId', 
    'customId', 
    'email', 
    'phone',
  ]);
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['customerIdentifier', customerIdentifierValidator],
]);

const shopifyCustomerGet = async (
  credsPayload,
  customerIdentifier,
  {
    apiVersion,
    attrs = defaultAttrs,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({ credsPayload, customerIdentifier });
  if (rejectResponse) {
    return rejectResponse;
  }

  const {
    customerId,
    customId,
    email,
    phone,
  } = customerIdentifier;

  if (!customerId) {

    const creds = await credsFromPayload(credsPayload);

    const query = `
      query GetCustomerByIdentifier ($identifier: CustomerIdentifierInput!) {
        customer: customerByIdentifier(identifier: $identifier) {
          ${ attrs }
        } 
      }
    `;

    const variables = {
      identifier: {
        ...customId && { customId },
        ...email && { emailAddress: email },
        ...phone && { phoneNumber: phone },
      },
    };

    const response = await shopifyClient.fetch({
      method: 'post',
      body: { query, variables },
      context: {
        creds,
        apiVersion,
        resultPath: 'data.customer',
      },
    });

    return response;
  }

  return shopifyGetSingle(
    credsPayload,
    'customer',
    customerId,
    {
      apiVersion,
      attrs,
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyCustomerGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyCustomerGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "customerIdentifier": { "customerId": "8575963103304" }
  }'

curl -X POST "http://localhost:8000/shopifyCustomerGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "customerIdentifier": { "email": "john+testing@whitefoxboutique.com" }
  }'
*/
