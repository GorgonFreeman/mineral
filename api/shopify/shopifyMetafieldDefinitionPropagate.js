// https://shopify.dev/docs/api/admin-graphql/latest/mutations/metafieldDefinitionCreate
// https://shopify.dev/docs/api/admin-graphql/latest/queries/metafieldDefinition

const { credsValidator } = require('../validators');
const { ArgsWarden, objHasAny } = require('../utils');
const { shopifyMetafieldDefinitionGet } = require('./shopifyMetafieldDefinitionGet');
const { shopifyMetafieldDefinitionCreate } = require('./shopifyMetafieldDefinitionCreate');

const defaultReturnCreatedDefinitionAttrs = 'id name namespace key ownerType type { name }';

const metafieldDefinitionIdentifierValidator = (metafieldDefinitionIdentifier) => {
  return objHasAny(metafieldDefinitionIdentifier, [
    'ownerType',
    'namespace',
    'key',
  ]);
};

const argsWarden = new ArgsWarden([
  ['fromStoreCredsPayload', credsValidator],
  ['toStoreCredsPayload', credsValidator],
  ['metafieldDefinitionIdentifier', metafieldDefinitionIdentifierValidator],
]);

const metafieldDefinitionInputFromDefinition = (sourceDefinition) => {
  const {
    name,
    namespace,
    key,
    description,
    ownerType,
    type,
    validations,
    capabilities,
    pinnedPosition,
  } = sourceDefinition;

  const definitionInput = {
    name,
    namespace,
    key,
    ownerType,
    type: type?.name,
    ...(description && { description }),
    ...(pinnedPosition != null && { pin: true }),
  };

  if (Array.isArray(validations) && validations.length) {
    definitionInput.validations = validations.map(({ name: validationName, value }) => ({
      name: validationName,
      value,
    }));
  }

  if (capabilities) {
    definitionInput.capabilities = {
      ...(capabilities.adminFilterable && {
        adminFilterable: { enabled: capabilities.adminFilterable.enabled },
      }),
      ...(capabilities.smartCollectionCondition && {
        smartCollectionCondition: { enabled: capabilities.smartCollectionCondition.enabled },
      }),
      ...(capabilities.uniqueValues && {
        uniqueValues: { enabled: capabilities.uniqueValues.enabled },
      }),
    };
  }

  return definitionInput;
};

const shopifyMetafieldDefinitionPropagate = async (
  fromStoreCredsPayload,
  toStoreCredsPayload,
  metafieldDefinitionIdentifier,
  {
    apiVersion,
    returnCreatedDefinitionAttrs = defaultReturnCreatedDefinitionAttrs,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    fromStoreCredsPayload,
    toStoreCredsPayload,
    metafieldDefinitionIdentifier,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const sourceResponse = await shopifyMetafieldDefinitionGet(
    fromStoreCredsPayload,
    metafieldDefinitionIdentifier,
    { apiVersion },
  );

  if (!sourceResponse.ok) {
    return sourceResponse;
  }

  if (!sourceResponse.data) {
    return {
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Metafield definition not found on source store.',
        details: metafieldDefinitionIdentifier,
      },
    };
  }

  const definitionInput = metafieldDefinitionInputFromDefinition(sourceResponse.data);

  const {
    ownerType,
    namespace,
    key,
    name,
    type,
    description,
    pin,
    validations,
    capabilities,
  } = definitionInput;

  return shopifyMetafieldDefinitionCreate(
    toStoreCredsPayload,
    ownerType,
    namespace,
    key,
    name,
    type,
    {
      apiVersion,
      ...(description && { description }),
      ...(pin != null && { pin }),
      ...(validations && { validations }),
      ...(capabilities && { capabilities }),
      returnSchema: `
        createdDefinition { ${ returnCreatedDefinitionAttrs } }
      `.trim(),
    },
  );
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyMetafieldDefinitionPropagate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyMetafieldDefinitionPropagate" \
  -H "Content-Type: application/json" \
  -d '{
    "fromStoreCredsPayload": { "credsPath": "shopify.au" },
    "toStoreCredsPayload": { "credsPath": "shopify.us" },
    "metafieldDefinitionIdentifier": {
      "ownerType": "PRODUCT",
      "namespace": "custom",
      "key": "outfit_builder_image"
    }
  }'
*/
