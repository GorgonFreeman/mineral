const { shopifyOrderGet } = require('./api/shopify/shopifyOrderGet');

const [
  storeUrl,
  shopifyApiKey,
  orderId,
] = process.argv.slice(2);

shopifyOrderGet(
  {
    credsObject: {
      STORE_URL: storeUrl,
      SHOPIFY_API_KEY: shopifyApiKey,
    },
  },
  orderId,
).then((result) => {
  console.log('result', result);
});

// node test.js a-b-c shpat_111111 1111
