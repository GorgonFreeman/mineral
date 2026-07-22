// https://api-docs.starshipit.com/#8cfbd1b2-bd08-4cec-966f-7104cc147aee

const { ArgsWarden, credsFromPayload } = require('../utils');
const { credsValidator } = require('../validators');
const { starshipitClient } = require('../starshipit/starshipit.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['sku'],
]);

const starshipitProductAdd = async (
  credsPayload,
  sku,
  {
    title,
    customsDescription,
    description,
    country,
    weight,
    height,
    length,
    width,
    hsCode,
    color,
    size,
    barcode,
    binLocation,
    brand,
    usage,
    material,
    model,
    mid,
    price,
    dangerousGoodsType,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    sku,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const creds = await credsFromPayload(credsPayload);

  return starshipitClient.fetch({
    url: '/products',
    method: 'post',
    body: {
      product: {
        sku,
        ...title && { title },
        ...customsDescription && { customs_description: customsDescription },
        ...description && { description },
        ...country && { country },
        ...weight && { weight },
        ...height && { height },
        ...length && { length },
        ...width && { width },
        ...hsCode && { hs_code: hsCode },
        ...color && { color },
        ...size && { size },
        ...barcode && { barcode },
        ...binLocation && { bin_location: binLocation },
        ...brand && { brand },
        ...usage && { usage },
        ...material && { material },
        ...model && { model },
        ...mid && { mid },
        ...price && { price },
        ...dangerousGoodsType && { dangerous_goods_type: dangerousGoodsType },
      },
    },
    context: {
      creds,
    },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  starshipitProductAdd,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/starshipitProductAdd" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "starshipit.acc" },
    "sku": "WFAL48-1-S",
    "options": { "title": "Example Product" }
  }'
*/
