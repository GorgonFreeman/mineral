const { FetchClient, credsFromPayload, appendUrlToBase, logDeep } = require('../utils');
const { peoplevoxAuthGet } = require('../peoplevox/peoplevoxAuthGet');

const peoplevoxClient = new FetchClient({
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

module.exports = {
  peoplevoxClient,
};