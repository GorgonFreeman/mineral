const { shopifyOrdersGet } = require('./api/shopify/shopifyOrdersGet');

const [
  storeHandle,
  apiKey,
] = process.argv.slice(2);

shopifyOrdersGet(
  {
    credsObject: {
      STORE_HANDLE: storeHandle,
      API_KEY: apiKey,
    },
  },
).then((result) => {
  console.log('result', result);
});

// node test.js a-b-c shpat_111111 1111
