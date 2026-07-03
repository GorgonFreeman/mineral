const { credsValidator } = require('../validators');
const { responseIfRejectingArgs } = require('../utils');
const { peoplevoxClient } = require('../peoplevox/peoplevox.utils');

const validatorsByArg = {
  credsPayload: credsValidator,
  reportName: Boolean,
};

const peoplevoxReportGet = async (
  credsPayload,
  reportName,
  {
    searchClause,
    perPage,
    filter,
    orderBy,
    columns,
  } = {},
) => {

  const rejectResponse = await responseIfRejectingArgs(validatorsByArg, { credsPayload, reportName });
  if (rejectResponse) {
    return rejectResponse;
  }

  const reportGetResponse = await peoplevoxClient.fetch({
    method: 'post',
    body: {
      getReportRequest: {
        TemplateName: reportName,
        ...(searchClause ? { SearchClause: searchClause } : {}),
        ...(perPage ? { ItemsPerPage: perPage } : {}),
        ...(filter ? { FilterClause: filter } : {}),
        ...(orderBy ? { OrderBy: orderBy } : {}),
        ...(columns ? { Columns: columns.join(',') } : {}),
      },
    },
    context: {
      credsPayload,
      action: 'GetReportData',
    },
  });

  return reportGetResponse;
};

const funcApiConfig = {
  argNames: ['credsPayload', 'reportName'],
  validatorsByArg,
};

module.exports = {
  peoplevoxReportGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/peoplevoxReportGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "peoplevox" },
    "reportName": "Item inventory summary"
  }'

curl -X POST "http://localhost:8000/peoplevoxReportGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "peoplevox" },
    "reportName": "Despatch summary",
    "options": {
      "searchClause": "([Salesorder number].Equals(\"11221660500337\"))",
      "perPage": 50,
      "columns": ["Salesorder number", "Despatch number", "Tracking number"]
    }
  }'
*/
