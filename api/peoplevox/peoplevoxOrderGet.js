const { peoplevoxClient } = require('../peoplevox/peoplevox.utils');

const peoplevoxOrderGet = async (
  credsPayload,
  salesOrderNumber,
) => {

  const orderGetResponse = await peoplevoxClient.fetch({
    method: 'post',
    body: `
      <getRequest>
        <TemplateName>Sales orders</TemplateName>
        <SearchClause>SalesOrderNumber.Equals("${ salesOrderNumber }")</SearchClause>
      </getRequest>
    `.trim(),
    context: {
      credsPayload,
      action: 'GetData',
    },
  });

  return orderGetResponse;
};

module.exports = {
  peoplevoxOrderGet,
};

/*
curl localhost:8000/peoplevoxOrderGet \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "args": [
      {
        "credsObject": {
          "CLIENT_ID": "kaibacorp",
          "USERNAME": "Seto",
          "PASSWORD": "8lu33y3z8e$t"
        }
      },
      "7680864157768"
    ]
  }'

curl -X POST "http://localhost:8000/peoplevoxOrderGet" \
  -H "Content-Type: application/json" \
  -d '{ "args": [
    { "credsPath": "peoplevox" },
    "7680864157768"
  ] }'
*/
