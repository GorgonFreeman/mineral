const { credsValidator } = require('../validators');
const { ArgsWarden } = require('../utils');
const { peoplevoxClient } = require('../peoplevox/peoplevox.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['reportName'],
]);

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

  const rejectResponse = await argsWarden.responseIfRejectingArgs({ credsPayload, reportName });
  if (rejectResponse) {
    return rejectResponse;
  }

  const reportGetResponse = await peoplevoxClient.fetch({
    requestPayload: {
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
    },
    context: {
      credsPayload,
      action: 'GetReportData',
    },
  });

  return reportGetResponse;
};

const funcApiConfig = {
  argsWarden,
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
