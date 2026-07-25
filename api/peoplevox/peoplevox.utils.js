const csvtojson = require('csvtojson');
const xml2js = require('xml2js');
const { resolveCreds } = require('../pipelineSteps');
const {
  FetchClient,
  appendUrlToBase,
  logDeep,
} = require('../utils');
const { getSessionId, setSessionId } = require('../peoplevox/peoplevox.sessions');

const xml2jsBuilder = new xml2js.Builder({
  headless: true,
  renderOpts: {
    pretty: false,
  },
});

const buildSoapEnvelope = ({
  action,
  body,
  clientId,
  sessionId,
}) => {
  const envelopeObject = {
    'soap:Envelope': {
      '$': {
        'xmlns:soap': 'http://schemas.xmlsoap.org/soap/envelope/',
      },
      'soap:Header': {
        'UserSessionCredentials': {
          '$': {
            'xmlns': 'http://www.peoplevox.net/',
          },
          'UserId': 1,
          'ClientId': clientId,
          'SessionId': sessionId,
        },
      },
      'soap:Body': {
        [action]: {
          '$': {
            'xmlns': 'http://www.peoplevox.net/',
          },
          ...body,
        },
      },
    },
  };

  return xml2jsBuilder.buildObject(envelopeObject);
};

const useSoapEnvelope = async (state) => {
  const { requestPayload, context } = state;
  const { creds, action, sessionId } = context;
  const { CLIENT_ID } = creds;

  if (!sessionId) {
    throw new Error('PeopleVox sessionId is required');
  }

  const baseUrl = `https://ap.peoplevox.net/${ CLIENT_ID }/Resources/IntegrationServicev4.asmx`;
  const { headers, body } = requestPayload;

  const envelopeXml = buildSoapEnvelope({
    action,
    body,
    clientId: CLIENT_ID,
    sessionId,
  });

  logDeep({ envelopeXml });

  return {
    requestPayload: {
      ...requestPayload,
      url: appendUrlToBase(baseUrl, requestPayload.url),
      headers: {
        ...headers,
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `http://www.peoplevox.net/${ action }`,
      },
      body: envelopeXml,
    },
  };
};

const stripEnvelope = (state) => {
  const { response, context } = state;
  const { action } = context;

  if (!response?.data) {
    return {};
  }

  return {
    response: {
      data: response.data?.['soap:Envelope']?.['soap:Body']?.[`${ action }Response`]?.[`${ action }Result`],
    },
  };
};

const tryToParseDetailAsCsv = async (state) => {
  const { response } = state;

  if (!response?.ok || !response?.data?.Detail) {
    return {};
  }

  const { Detail } = response.data;

  if (typeof Detail !== 'string') {
    return {};
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
    response: {
      data: {
        Detail: parsedDetail,
      },
    },
  };
};

const unwrapSingleDetail = (state) => {
  const { response } = state;

  if (!response?.ok || !Array.isArray(response?.data?.Detail)) {
    return {};
  }

  const { Detail } = response.data;

  if (Detail.length !== 1) {
    return {};
  }

  return {
    response: {
      data: {
        Detail: Detail[0],
      },
    },
  };
};

const hoistDetail = (state) => {
  const { response } = state;

  if (!response?.ok || !response?.data || response.data.Detail === undefined) {
    return {};
  }

  const { Detail, ...metaFromData } = response.data;

  return {
    response: {
      data: Detail,
      meta: metaFromData,
    },
  };
};

const peoplevoxClient = new FetchClient({
  pipeline: [
    resolveCreds,
    useSoapEnvelope,
    'fetch',
    stripEnvelope,
    tryToParseDetailAsCsv,
    unwrapSingleDetail,
    hoistDetail,
  ],
});

const fetchWithoutAuth = peoplevoxClient.fetch.bind(peoplevoxClient);

peoplevoxClient.fetch = async ({
  requestPayload,
  context = {},
  inspect = false,
}) => {
  const { credsPayload } = context;

  const sessionIdResponse = await getSessionId(credsPayload);

  const {
    ok: sessionIdOk,
    data: sessionId,
  } = sessionIdResponse;

  if (!sessionIdOk) {
    return sessionIdResponse;
  }

  const response = await fetchWithoutAuth({
    requestPayload,
    context: {
      ...context,
      sessionId,
    },
    inspect,
  });

  if (response.ok) {
    await setSessionId(credsPayload, sessionId);
  }

  // TODO: Check if it was an auth error, and try another auth method if so
  return response;
};

module.exports = {
  peoplevoxClient,
};
