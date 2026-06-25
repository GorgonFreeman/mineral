const { credsFromPayload, FetchClient, appendUrlToBase, logDeep } = require('../utils');
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
      const { credsPayload, action } = context;
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

      const baseUrl = `https://ap.peoplevox.net/${ CLIENT_ID }/Resources/IntegrationServicev4.asmx`;

      const mergedHeaders = {
        ...headers,
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `http://www.peoplevox.net/${ action }`,
      };

      const wrappedBody = `
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Header>
            <UserSessionCredentials xmlns="http://www.peoplevox.net/">
              <UserId>1</UserId>
              <ClientId>${ CLIENT_ID }</ClientId>
              <SessionId>${ localSessionId }</SessionId>
            </UserSessionCredentials>
          </soap:Header>
          <soap:Body>
            <${ action } xmlns="http://www.peoplevox.net/">
              ${ body }
            </${ action }>
          </soap:Body>
        </soap:Envelope>
      `.trim();

      logDeep({ wrappedBody });

      return {
        ...requestPayload,
        url: appendUrlToBase(baseUrl, requestPayload.url),
        headers: mergedHeaders,
        body: wrappedBody,
      };
    },
  });

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
      sessionId,
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
*/
