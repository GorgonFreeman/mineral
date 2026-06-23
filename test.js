const { shopifyOrderGet } = require('./api/shopify/shopifyOrderGet');

const [
  storeHandle,
  apiKey,
  orderId,
] = process.argv.slice(2);

shopifyOrderGet(
  {
    credsObject: {
      STORE_HANDLE: storeHandle,
      API_KEY: apiKey,
    },
  },
  orderId,
).then((result) => {
  console.log('result', result);
});

// node test.js a-b-c shpat_111111 1111
