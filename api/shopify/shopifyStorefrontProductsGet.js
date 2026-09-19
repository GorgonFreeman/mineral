// https://shopify.dev/docs/api/storefront/latest/queries/products

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { shopifyStorefrontGet, shopifyStorefrontGetter } = require('./shopifyStorefrontGet');

const defaultAttrs = `
id
  handle
  title
  availableForSale
`.trim();

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const shopifyStorefrontProductsGetInner = async (
  returnGetter,
  credsPayload,
  {
    attrs = defaultAttrs,
    ...getterOptions
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const getterArgs = [
    credsPayload,
    'product',
    {
      attrs,
      ...getterOptions,
    },
  ];

  return returnGetter
    ? shopifyStorefrontGetter(...getterArgs)
    : shopifyStorefrontGet(...getterArgs);
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyStorefrontProductsGet: (...args) => shopifyStorefrontProductsGetInner(false, ...args),
  shopifyStorefrontProductsGetter: (...args) => shopifyStorefrontProductsGetInner(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyStorefrontProductsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "options": {
      "attrs": "id handle title description descriptionHtml availableForSale productType vendor tags createdAt updatedAt publishedAt onlineStoreUrl isGiftCard requiresSellingPlan totalInventory seo { title description } featuredImage { id url altText width height } priceRange { minVariantPrice { amount currencyCode } maxVariantPrice { amount currencyCode } } compareAtPriceRange { minVariantPrice { amount currencyCode } maxVariantPrice { amount currencyCode } } options { id name values } images(first: 5) { edges { node { id url altText width height } } } media(first: 5) { edges { node { mediaContentType ... on MediaImage { id image { url altText width height } } } } } variants(first: 20) { edges { node { id title sku barcode availableForSale quantityAvailable currentlyNotInStock requiresComponents selectedOptions { name value } image { id url altText width height } price { amount currencyCode } compareAtPrice { amount currencyCode } unitPrice { amount currencyCode } weight weightUnit } } } sellingPlanGroups(first: 5) { edges { node { name sellingPlans(first: 5) { edges { node { id name description options { name value } } } } } } } category { id name ancestors { id name } } metafields(identifiers: [{namespace: \"shopify\", key: \"color-pattern\"}, {namespace: \"shopify\", key: \"target-gender\"}, {namespace: \"shopify\", key: \"age-group\"}, {namespace: \"shopify\", key: \"fabric\"}, {namespace: \"shopify\", key: \"neckline\"}, {namespace: \"shopify\", key: \"sleeve-length-type\"}, {namespace: \"shopify\", key: \"clothing-features\"}, {namespace: \"shopify\", key: \"dress-occasion\"}]) { id namespace key type value }"
    }
  }'

curl -X POST "http://localhost:8000/shopifyStorefrontProductsGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "shopify.au" },
    "options": {
      "attrs": "id handle title description descriptionHtml availableForSale productType vendor tags createdAt updatedAt publishedAt onlineStoreUrl isGiftCard requiresSellingPlan totalInventory seo { title description } featuredImage { id url altText width height } priceRange { minVariantPrice { amount currencyCode } maxVariantPrice { amount currencyCode } } compareAtPriceRange { minVariantPrice { amount currencyCode } maxVariantPrice { amount currencyCode } } options { id name values } images(first: 5) { edges { node { id url altText width height } } } media(first: 5) { edges { node { mediaContentType ... on MediaImage { id image { url altText width height } } } } } variants(first: 20) { edges { node { id title sku barcode availableForSale quantityAvailable currentlyNotInStock requiresComponents selectedOptions { name value } image { id url altText width height } price { amount currencyCode } compareAtPrice { amount currencyCode } unitPrice { amount currencyCode } weight weightUnit } } } sellingPlanGroups(first: 5) { edges { node { name sellingPlans(first: 5) { edges { node { id name description options { name value } } } } } } } category { id name ancestors { id name } } metafields(identifiers: [{namespace: \"shopify\", key: \"color-pattern\"}, {namespace: \"shopify\", key: \"target-gender\"}, {namespace: \"shopify\", key: \"age-group\"}, {namespace: \"shopify\", key: \"fabric\"}, {namespace: \"shopify\", key: \"neckline\"}, {namespace: \"shopify\", key: \"sleeve-length-type\"}, {namespace: \"shopify\", key: \"clothing-features\"}, {namespace: \"shopify\", key: \"dress-occasion\"}]) { id namespace key type value }"
    }
  }'
*/
