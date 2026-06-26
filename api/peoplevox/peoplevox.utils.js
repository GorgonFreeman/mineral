const csvtojson = require('csvtojson');
const { FetchClient, credsFromPayload, appendUrlToBase, logDeep, Chain } = require('../utils');
const { peoplevoxAuthGet } = require('../peoplevox/peoplevoxAuthGet');

const stripEnvelope = (response, context) => {
  const { action } = context;

  return {
    ...response,
    ...response?.data ? {
      data: response.data?.['soap:Envelope']?.['soap:Body']?.[`${ action }Response`]?.[`${ action }Result`],
    } : {},
  };
};

const tryToParseDetailAsCsv = async (response) => {
  if (!response?.ok || !response?.data?.Detail) {
    return response;
  }

  const { Detail } = response.data;

  if (typeof Detail !== 'string') {
    return response;
  }

  let parsedDetail = Detail;

  try {
    const parsed = await csvtojson().fromString(Detail);

    if (parsed.length || !Detail.trim()) {
      parsedDetail = parsed;
    }
  } catch (error) {
    console.warn('error parsing Detail', error, Detail);
  }

  return {
    ...response,
    data: {
      ...response.data,
      Detail: parsedDetail,
    },
  };
};

const unwrapSingleDetail = (response) => {
  if (!response?.ok || !Array.isArray(response?.data?.Detail)) {
    return response;
  }

  const { Detail } = response.data;

  if (Detail.length !== 1) {
    return response;
  }

  return {
    ...response,
    data: {
      ...response.data,
      Detail: Detail[0],
    },
  };
};

const peoplevoxClient = new FetchClient({
  requestPreparer: async (requestPayload, context) => {
    const { headers, body } = requestPayload;
    const { credsPayload, action } = context;
    let { sessionId: localSessionId } = context;
    const { CLIENT_ID, USERNAME, PASSWORD } = await credsFromPayload(credsPayload);

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
  responseInterpreter: new Chain([
    stripEnvelope,
    tryToParseDetailAsCsv,
    unwrapSingleDetail,
  ]),
});

module.exports = {
  peoplevoxClient,
};