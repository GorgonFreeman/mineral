const { credsFromPayload, customFetch } = require('../utils');

const peoplevoxAuthGet = async (
  credsPayload,
) => {

  const {
    CLIENT_ID,
    USERNAME,
    PASSWORD,
  } = credsFromPayload(credsPayload);

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

  return response;
};

module.exports = {
  peoplevoxAuthGet,
};

/*
curl -X POST "http://localhost:8000/peoplevoxAuthGet" \
  -H "Content-Type: application/json" \
  -d '{
    "args": [
      {
        "credsObject": {
          "CLIENT_ID": "aveng1963",
          "USERNAME": "bannerb",
          "PASSWORD": "$MASh123!"
        }
      }
    ]
  }'
  */