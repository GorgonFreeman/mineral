const { shopifyOrderGet } = require('./api/shopify/shopifyOrderGet');

shopifyOrderGet('1234567890').then((result) => {
  console.log(result);
});

// node test.js