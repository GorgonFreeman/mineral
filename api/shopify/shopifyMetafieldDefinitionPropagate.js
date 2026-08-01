// https://shopify.dev/docs/api/admin-graphql/latest/mutations/metafieldDefinitionCreate
// https://shopify.dev/docs/api/admin-graphql/latest/queries/metafieldDefinition

const { credsValidator } = require('../validators');
const { ArgsWarden, credsFromPayload, objHasAny } = require('../utils');
const { shopifyClient } = require('./shopify.utils');
const { shopifyMutationDo } = require('./shopifyMutationDo');

const sourceMetafieldDefinitionAttrs = `
  name
  namespace
  key
  description
  ownerType
  pinnedPosition
  type {
    name
  }
  validations {
    name
    value
  }
  capabilities {
    adminFilterable {
      enabled
    }
    smartCollectionCondition {
      enabled
    }
    uniqueValues {
      enabled
    }
  }
`.trim();

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

const fetchSourceMetafieldDefinition = async (
  fromStoreCredsPayload,
  metafieldDefinitionIdentifier,
  {
    apiVersion,
  } = {},
) => {
  const creds = await credsFromPayload(fromStoreCredsPayload);

  return shopifyClient.fetch({
    method: 'post',
    body: {
      query: `
        query GetMetafieldDefinition($identifier: MetafieldDefinitionIdentifierInput!) {
          metafieldDefinition(identifier: $identifier) {
            ${ sourceMetafieldDefinitionAttrs }
          }
        }
      `,
      variables: {
        identifier: metafieldDefinitionIdentifier,
      },
    },
    context: {
      creds,
      apiVersion,
      resultPath: 'data.metafieldDefinition',
    },
  });
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

  const sourceResponse = await fetchSourceMetafieldDefinition(
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

  return shopifyMutationDo(
    toStoreCredsPayload,
    'metafieldDefinitionCreate',
    {
      mutationVariables: {
        definition: {
          type: 'MetafieldDefinitionInput!',
          value: definitionInput,
        },
      },
      returnSchema: `
        createdDefinition { ${ returnCreatedDefinitionAttrs } }
      `.trim(),
      apiVersion,
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
