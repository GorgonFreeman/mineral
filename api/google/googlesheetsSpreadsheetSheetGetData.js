const { ArgsWarden, objHasAny } = require('../utils');
const { credsValidator } = require('../validators');
const { getGoogleSheets, googleApiCall } = require('../google/google.utils');

const spreadsheetIdentifierValidator = (spreadsheetIdentifier) => {
  return objHasAny(spreadsheetIdentifier, ['spreadsheetId']);
};

const sheetIdentifierValidator = (sheetIdentifier) => {
  return objHasAny(sheetIdentifier, ['sheetName', 'sheetId', 'sheetIndex']);
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['spreadsheetIdentifier', spreadsheetIdentifierValidator],
  ['sheetIdentifier', sheetIdentifierValidator],
]);

const googlesheetsSpreadsheetSheetGetData = async (
  credsPayload,
  spreadsheetIdentifier,
  sheetIdentifier,
  {
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    spreadsheetIdentifier,
    sheetIdentifier,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const { spreadsheetId } = spreadsheetIdentifier;
  const {
    sheetName,
    sheetId,
    sheetIndex,
  } = sheetIdentifier;

  const { client, error } = await getGoogleSheets(credsPayload);

  if (error) {
    return error;
  }

  const spreadsheetResponse = await googleApiCall(() => client.spreadsheets.get({
    spreadsheetId,
  }));

  if (!spreadsheetResponse.ok) {
    return spreadsheetResponse;
  }

  const sheetsArray = spreadsheetResponse.data?.sheets;

  if (!sheetsArray?.length) {
    return {
      ok: false,
      error: {
        code: 'NO_SHEETS',
        message: 'No sheets found in spreadsheet',
      },
    };
  }

  let resolvedSheetName = sheetName;

  if (!resolvedSheetName) {
    if (sheetId !== undefined) {
      const sheet = sheetsArray.find((s) => s.properties.sheetId === sheetId);
      if (!sheet) {
        return {
          ok: false,
          error: {
            code: 'SHEET_NOT_FOUND',
            message: `Sheet with ID ${ sheetId } not found`,
          },
        };
      }
      resolvedSheetName = sheet.properties.title;
    } else if (sheetIndex !== undefined) {
      if (sheetIndex < 0 || sheetIndex >= sheetsArray.length) {
        return {
          ok: false,
          error: {
            code: 'SHEET_INDEX_OUT_OF_RANGE',
            message: `Sheet index ${ sheetIndex } is out of range (0-${ sheetsArray.length - 1 })`,
          },
        };
      }
      resolvedSheetName = sheetsArray[sheetIndex].properties.title;
    } else {
      resolvedSheetName = sheetsArray[0].properties.title;
    }
  }

  const valuesResponse = await googleApiCall(() => client.spreadsheets.values.get({
    spreadsheetId,
    range: `'${ resolvedSheetName }'!A:ZZ`,
  }));

  if (!valuesResponse.ok) {
    return valuesResponse;
  }

  const values = valuesResponse.data?.values;

  if (!values?.length) {
    return {
      ok: true,
      data: [],
    };
  }

  const headers = values[0] || [];

  if (!headers.length) {
    return {
      ok: true,
      data: [],
    };
  }

  const dataRows = values.slice(1);
  const data = dataRows.map((row) => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] !== undefined ? row[index] : '';
    });
    return obj;
  });

  return {
    ok: true,
    data,
  };
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  googlesheetsSpreadsheetSheetGetData,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/googlesheetsSpreadsheetSheetGetData" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "google" },
    "spreadsheetIdentifier": { "spreadsheetId": "ABC123" },
    "sheetIdentifier": { "sheetName": "Sheet 1" }
  }'
*/
