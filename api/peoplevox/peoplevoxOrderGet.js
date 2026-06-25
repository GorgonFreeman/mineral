const { credsFromPayload, FetchClient } = require('../utils');
const { peoplevoxAuthGet } = require('../peoplevox/peoplevoxAuthGet');

const peoplevoxOrderGet = async (
  credsPayload,
  salesOrderNumber,
) => {

  const {
    CLIENT_ID,
    USERNAME,
    PASSWORD,
  } = credsFromPayload(credsPayload);

  const authResponse = await peoplevoxAuthGet(credsPayload);
  if (!authResponse.ok) {
    return authResponse;
  }

  const { Detail } = authResponse?.data?.['soap:Envelope']?.['soap:Body']?.['AuthenticateResponse']?.['AuthenticateResult'];
  const [clientId, sessionId] = Detail.split(',');

  const peoplevoxClient = new FetchClient({
    context: {
      credsPayload,
    },
    requestPreparer: async (requestPayload, context) => {
      const { headers, body } = requestPayload;
      const { credsPayload } = context;
      let { sessionId: localSessionId } = context;
      const { CLIENT_ID, USERNAME, PASSWORD } = credsFromPayload(credsPayload);

      if (!localSessionId) {
        const authResponse = await peoplevoxAuthGet(credsPayload);
        if (!authResponse.ok) {
          return { ...authResponse, breakChain: true };
        }

        const { Detail } = authResponse?.data?.['soap:Envelope']?.['soap:Body']?.['AuthenticateResponse']?.['AuthenticateResult'];
        const [clientId, responseSessionId] = Detail.split(',');

        localSessionId = responseSessionId;
      }

      return {
        ...requestPayload,
        url: `https://ap.peoplevox.net/${ CLIENT_ID }/Resources/IntegrationServicev4.asmx`,
        headers: {
          ...headers,
          'Content-Type': 'text/xml; charset=utf-8',
        },
        body: `
          <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
            <soap:Header>
              <UserSessionCredentials>
                <UserId>0</UserId>
                <clientId>${ CLIENT_ID }</clientId>
                <SessionId>${ localSessionId }</SessionId>
              </UserSessionCredentials>
            </soap:Header>
            <soap:Body>
              ${ body }
            </soap:Body>
          </soap:Envelope>
        `.trim(),
      };
    },
  });

  const orderGetResponse = await peoplevoxClient.fetch({
    method: 'post',
    body: {
      query: `
        query OrderGet($salesOrderNumber: String!) {
          order(salesOrderNumber: $salesOrderNumber) {
            id
            salesOrderNumber
          }
        }
      `,
      variables: {
        salesOrderNumber,
      },
    },
    context: {
      credsPayload,
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
*/
