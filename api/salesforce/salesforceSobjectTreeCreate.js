// https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/resources_composite_sobject_tree.htm

const { ArgsWarden, valueProvided } = require('../utils');
const { credsValidator } = require('../validators');
const { salesforceClient } = require('../salesforce/salesforce.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['sobjectType'],
  ['records'],
]);

const salesforceSobjectTreeCreate = async (
  credsPayload,
  sobjectType,
  records,
  {
    apiVersion,
    inspect = false,
    fetchClient = salesforceClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    sobjectType,
    records,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      method: 'post',
      url: `/composite/tree/${ sobjectType }`,
      body: {
        records,
      },
    },
    context: {
      credsPayload,
      apiVersion,
    },
    inspect,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  salesforceSobjectTreeCreate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/salesforceSobjectTreeCreate" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "salesforce" },
    "sobjectType": "Account",
    "records": [
      {
        "attributes": { "type": "Account", "referenceId": "ref1" },
        "Name": "Tree Account",
        "Contacts": {
          "records": [
            {
              "attributes": { "type": "Contact", "referenceId": "ref2" },
              "LastName": "Tree Contact"
            }
          ]
        }
      }
    ]
  }'
*/
