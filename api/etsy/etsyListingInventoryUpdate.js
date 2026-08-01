// https://developers.etsy.com/documentation/reference/#operation/updateListingInventory

const { ArgsWarden, actionSingleOrMultiple, everyIfArray, valueProvided } = require('../utils');
const { credsValidator } = require('../validators');
const { etsyClient } = require('./etsy.utils');

const updatePayloadWithListingIdValidator = (updatePayloadWithListingId) => {
  const { listingId, ...updatePayload } = updatePayloadWithListingId;
  return valueProvided(listingId) && Object.keys(updatePayload).length > 0;
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['updatePayloadWithListingId', (updatePayloadWithListingId) => everyIfArray(updatePayloadWithListingIdValidator, updatePayloadWithListingId)],
]);

const etsyListingInventoryUpdateSingle = async (
  credsPayload,
  updatePayloadWithListingId,
  {
    params,
    inspect = false,
    fetchClient = etsyClient,
  } = {},
) => {

  const {
    listingId,
    ...updatePayload
  } = updatePayloadWithListingId;

  return fetchClient.fetch({
    requestPayload: {
      method: 'put',
      url: `/application/listings/${ listingId }/inventory`,
      body: updatePayload,
      ...(params && { params }),
    },
    context: {
      credsPayload,
      withAccessToken: true,
    },
    inspect,
  });
};

const etsyListingInventoryUpdate = async (
  credsPayload,
  updatePayloadWithListingId,
  {
    params,
    inspect = false,
    fetchClient = etsyClient,
    queueRunOptions,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    updatePayloadWithListingId,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return actionSingleOrMultiple(
    updatePayloadWithListingId,
    etsyListingInventoryUpdateSingle,
    (updatePayloadWithListingIdItem) => ({
      args: [credsPayload, updatePayloadWithListingIdItem, { params, inspect, fetchClient }],
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
  etsyListingInventoryUpdate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/etsyListingInventoryUpdate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": {
      "credsPath": "etsy"
    },
    "updatePayloadWithListingId": {
      "listingId": "1234567890",
      "products": []
    }
  }'
*/
