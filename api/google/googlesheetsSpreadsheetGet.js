// https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/get

const { ArgsWarden, objHasAny } = require('../utils');
const { credsValidator } = require('../validators');
const { getGoogleSheets, googleApiCall } = require('../google/google.utils');

const spreadsheetIdentifierValidator = (spreadsheetIdentifier) => {
  return objHasAny(spreadsheetIdentifier, ['spreadsheetId']);
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['spreadsheetIdentifier', spreadsheetIdentifierValidator],
]);

const googlesheetsSpreadsheetGet = async (
  credsPayload,
  spreadsheetIdentifier,
  {
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    spreadsheetIdentifier,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const { spreadsheetId } = spreadsheetIdentifier;
  const { client, error } = await getGoogleSheets(credsPayload);

  if (error) {
    return error;
  }

  return googleApiCall(() => client.spreadsheets.get({ spreadsheetId }));
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  googlesheetsSpreadsheetGet,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/googlesheetsSpreadsheetGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "google" },
    "spreadsheetIdentifier": { "spreadsheetId": "ABC123" }
  }'
*/
