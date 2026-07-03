const csvtojson = require('csvtojson');
const { json2csv } = require('json-2-csv');
const xml2js = require('xml2js');
const { FetchClient, credsFromPayload, appendUrlToBase, logDeep, Chain } = require('../utils');
const { peoplevoxAuthGet } = require('../peoplevox/peoplevoxAuthGet');

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

// TODO: Split into multiple steps, allow mutating context
const prepareSaveDataCsv = async (state) => {
  const { requestPayload } = state;
  const csvData = requestPayload?.body?.saveRequest?.CsvData;

  if (typeof csvData === 'string' || csvData === undefined) {
    return {};
  }

  const rows = Array.isArray(csvData) ? csvData : [csvData];
  const csvString = await json2csv(rows);

  return {
    requestPayload: {
      body: {
        saveRequest: {
          CsvData: csvString,
        },
      },
    },
  };
};

const peoplevoxSoapRequestPreparer = async (state) => {
  const { requestPayload, context } = state;
  const { headers, body } = requestPayload;
  const { credsPayload, action } = context;
  let { sessionId: localSessionId } = context;
  const { CLIENT_ID } = await credsFromPayload(credsPayload);

  if (!localSessionId) {
    const authResponse = await peoplevoxAuthGet(credsPayload);

    if (!authResponse.ok) {
      return {
        requestPayload: authResponse,
        breakChain: true,
      };
    }

    const { Detail } = authResponse?.data?.['soap:Envelope']?.['soap:Body']?.['AuthenticateResponse']?.['AuthenticateResult'];
    const [, responseSessionId] = Detail.split(',');

    localSessionId = responseSessionId;
  }

  const baseUrl = `https://ap.peoplevox.net/${ CLIENT_ID }/Resources/IntegrationServicev4.asmx`;

  const envelopeXml = buildSoapEnvelope({
    action,
    body,
    clientId: CLIENT_ID,
    sessionId: localSessionId,
  });

  logDeep({ envelopeXml });

  return {
    requestPayload: {
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

const peoplevoxRequestPreparer = new Chain([
  prepareSaveDataCsv,
  peoplevoxSoapRequestPreparer,
]);

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
  requestPreparer: peoplevoxRequestPreparer,
  responseInterpreter: new Chain([
    stripEnvelope,
    tryToParseDetailAsCsv,
    unwrapSingleDetail,
    hoistDetail,
  ]),
});

module.exports = {
  peoplevoxClient,
};