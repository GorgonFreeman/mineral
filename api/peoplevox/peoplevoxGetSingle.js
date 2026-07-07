const { peoplevoxClient } = require('../peoplevox/peoplevox.utils');
const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');

const searchParametersValidator = ({ searchClause, id, idName }) => {
  return searchClause || (id && idName);
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['templateName', Boolean],
  ['searchParameters', searchParametersValidator],
]);

const peoplevoxGetSingle = async (
  credsPayload,
  templateName,
  searchParameters = {},
  options = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    templateName,
    searchParameters,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const { searchClause, id, idName } = searchParameters;
  const resolvedSearchClause = searchClause || `${ idName }.Equals("${ id }")`;

  const response = await peoplevoxClient.fetch({
    method: 'post',
    body: {
      getRequest: {
        TemplateName: templateName,
        SearchClause: resolvedSearchClause,
      },
    },
    context: {
      credsPayload,
      action: 'GetData',
    },
  });

  if (!response.ok) {
    return response;
  }

  const { data } = response;

  const multipleResults = Array.isArray(data) && data.length > 1;

  if (!multipleResults) {
    return response;
  }

  if (id && idName) {
    const targetResults = data.filter(result => result[idName] === id);

    const stillMultipleResults = Array.isArray(targetResults) && targetResults.length > 1;
    if (stillMultipleResults) {
      return {
        ok: false,
        error: {
          code: 'MULTIPLE_RESULTS',
          message: 'Multiple results found',
          details: targetResults,
        },
      };
    }

    if (targetResults.length === 0) {
      return {
        ok: false,
        error: {
          code: 'NOT_FOUND',
          message: 'No results found',
        },
      };
    }

    return {
      ...response,
      data: targetResults[0],
    };
  }

  return response;
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  peoplevoxGetSingle,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/peoplevoxGetSingle" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "peoplevox" },
    "templateName": "Sales orders",
    "searchParameters": { "id": "7680864157768", "idName": "SalesOrderNumber" }
  }'

curl -X POST "http://localhost:8000/peoplevoxGetSingle" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "peoplevox" },
    "templateName": "Sales orders",
    "searchParameters": { "searchClause": "SalesOrderNumber.Equals(\"7680864157768\")" }
  }'
*/
