// https://g40-server.instance.3clickscloud.com/swagger-ui/index.html#operations-v1_-_Style_>_Details-updatePricing

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { threeclicksClient } = require('../threeclicks/threeclicks.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['styleNumber'],
  ['sizes'],
  ['buyPrice'],
  ['sellPrice'],
]);

const threeclicksStylePriceUpdate = async (
  credsPayload,
  styleNumber,
  sizes,
  buyPrice,
  sellPrice,
  {
    currency = 'USD',
    type = 'one_price',
    option,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    styleNumber,
    sizes,
    buyPrice,
    sellPrice,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const body = {
    sizes: sizes.map((size) => ({
      size,
      buy_price: [{ price: buyPrice, currency }],
      sell_price: [{ price: sellPrice, currency }],
      retail_price: [{ price: sellPrice, currency }],
      alt_retail_price: [{ price: sellPrice, currency }],
    })),
    type,
    ...option && { option },
  };

  return threeclicksClient.fetch({
    requestPayload: {
      url: `/style/basic/pricing/${ styleNumber }`,
      method: 'patch',
      body,
    },
    context: {
      credsPayload,
    },
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  threeclicksStylePriceUpdate,
  funcApiConfig,
};
