const { peoplevoxClient } = require('../peoplevox/peoplevox.utils');

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

module.exports = {
  peoplevoxReportGet,
};

/*
curl -X POST "http://localhost:8000/peoplevoxReportGet" \
  -H "Content-Type: application/json" \
  -d '{
    "args": [
      { "credsPath": "peoplevox" },
      "Item inventory summary"
    ]
  }'

curl -X POST "http://localhost:8000/peoplevoxReportGet" \
  -H "Content-Type: application/json" \
  -d '{
    "args": [
      { "credsPath": "peoplevox" },
      "Despatch summary",
      {
        "searchClause": "([Salesorder number].Equals(\"11221660500337\"))",
        "perPage": 50,
        "columns": ["Salesorder number", "Despatch number", "Tracking number"]
      }
    ]
  }'
*/
