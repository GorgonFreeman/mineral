const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');

const defaultAttrs = 'id name createdAt displayFinancialStatus displayFulfillmentStatus';

const shopifyOrderGet = async (
  credsPayload,
  {
    orderId,
    orderName,
  },
  {
    apiVersion,
    attrs = defaultAttrs,
  } = {},
) => {

  if (orderId) {
    const response = await shopifyGetSingle(
      credsPayload,
      'order',
      orderId,
      {
        apiVersion,
        attrs,
      },
    );

    return response;
  }

  /* orderName */
  // const response = await shopifyOrdersGet(credsPath, {
  //   apiVersion,
  //   attrs,
  //   queries: [`name:${ orderName }`],
  // });

  // const singleResponse = standardInterpreters.expectOne(response);

  // return singleResponse;
  /* /orderName */
};

module.exports = {
  shopifyOrderGet,
};

/*
curl -X POST "http://localhost:8000/shopifyOrderGet" \
  -H "Content-Type: application/json" \
  -d '{
    "args": [
      {
        "credsObject": {
          "STORE_HANDLE": "arisawa-heavy-industries",
          "API_KEY": "shpat_xxx"
        }
      },
      { "orderId": "1234567890" }
    ]
  }'

  curl -X POST "http://localhost:8000/shopifyOrderGet" \
  -H "Content-Type: application/json" \
  -d '{
    "args": [
      { "credsPath": "shopify.au" },
      { "orderId": "7015155466312" }
    ]
  }'
  */