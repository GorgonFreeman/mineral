const { peoplevoxClient } = require('../peoplevox/peoplevox.utils');

const buildGetReportBody = ({
  reportName,
  searchClause,
  perPage,
  filter,
  orderBy,
  columns,
}) => {
  const tags = [
    `<TemplateName>${ reportName }</TemplateName>`,
    ...(searchClause ? [`<SearchClause>${ searchClause }</SearchClause>`] : []),
    ...(perPage ? [`<ItemsPerPage>${ perPage }</ItemsPerPage>`] : []),
    ...(filter ? [`<FilterClause>${ filter }</FilterClause>`] : []),
    ...(orderBy ? [`<OrderBy>${ orderBy }</OrderBy>`] : []),
    ...(columns ? [`<Columns>${ columns.join(',') }</Columns>`] : []),
  ];

  return `<getReportRequest>${ tags.join('') }</getReportRequest>`;
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

  const reportGetResponse = await peoplevoxClient.fetch({
    method: 'post',
    body: buildGetReportBody({
      reportName,
      searchClause,
      perPage,
      filter,
      orderBy,
      columns,
    }),
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
*/
