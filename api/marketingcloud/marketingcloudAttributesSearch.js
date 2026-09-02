// https://developer.salesforce.com/docs/marketing/marketing-cloud/references/mc_rest_contacts/searchContactAttributes.html

const { ArgsWarden, valueProvided } = require('../utils');
const { credsValidator } = require('../validators');
const { marketingcloudClient } = require('../marketingcloud/marketingcloud.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['conditionSet', valueProvided],
]);

const marketingcloudAttributesSearch = async (
  credsPayload,
  conditionSet,
  {
    requestAttributes,
    inspect = false,
    fetchClient = marketingcloudClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    conditionSet,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const body = {
    conditionSet,
  };

  if (requestAttributes) {
    const attributes = Array.isArray(requestAttributes)
      ? requestAttributes.map((item) => (
        typeof item === 'string' ? { key: item } : item
      ))
      : requestAttributes;

    body.request = { attributes };
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'post',
      url: '/contacts/v1/attributes/search',
      body,
    },
    context: {
      credsPayload,
    },
    inspect,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  marketingcloudAttributesSearch,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/marketingcloudAttributesSearch" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "marketingcloud" },
    "conditionSet": {
      "operator": "And",
      "conditionSets": [],
      "conditions": [{
        "attribute": { "key": "MobileConnect Demographics.Mobile Number" },
        "operator": "Equals",
        "value": { "items": ["61412345678"] }
      }]
    },
    "options": {
      "requestAttributes": [
        "Contact.Contact Key",
        "MobileConnect Demographics.Mobile Number"
      ]
    }
  }'
*/
