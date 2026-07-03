const { credsFromPayload, customFetch, responseIfRejectingArgs } = require('../utils');
const { credsValidator } = require('../validators');

const validatorsByArg = {
  credsPayload: credsValidator,
};

const peoplevoxAuthGet = async (
  credsPayload,
) => {

  const rejectResponse = await responseIfRejectingArgs(validatorsByArg, { credsPayload });
  if (rejectResponse) {
    return rejectResponse;
  }

  const {
    CLIENT_ID,
    USERNAME,
    PASSWORD,
  } = await credsFromPayload(credsPayload);

  const url = `https://ap.peoplevox.net/${ CLIENT_ID }/Resources/IntegrationServicev4.asmx`;

  const headers = {
    'Content-Type': 'text/xml; charset=utf-8',
    'SOAPAction': 'http://www.peoplevox.net/Authenticate',
  };

  const envelope = `
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        <Authenticate xmlns="http://www.peoplevox.net/">
          <clientId>${ CLIENT_ID }</clientId>
          <username>${ USERNAME }</username>
          <password>${ btoa(PASSWORD) }</password>
        </Authenticate>
      </soap:Body>
    </soap:Envelope>
  `.trim();

  const response = await customFetch(
    url,
    {
      headers,
      method: 'post',
      body: envelope,
    },
  );

  /* e.g.
  'soap:Envelope': {
    'soap:Body': {
      AuthenticateResponse: {
        AuthenticateResult: {
          ResponseId: '0',
          TotalCount: '1',
          Detail: 'abc123,9999999-3e02-46a3-bb7c-9dca6b9db243',
          Statuses: '',
          ImportingQueueId: '0',
          SalesOrdersToDespatchIds: '',
          ErrorCode: ''
        }
      }
    }
  }
  */

  return response;
};

const funcApiConfig = {
  argNames: ['credsPayload'],
  validatorsByArg,
};

module.exports = {
  peoplevoxAuthGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/peoplevoxAuthGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": {
      "credsObject": {
        "CLIENT_ID": "aveng1963",
        "USERNAME": "bannerb",
        "PASSWORD": "$MASh123!"
      }
    }
  }'

curl -X POST "http://localhost:8000/peoplevoxAuthGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "peoplevox" }
  }'
*/
