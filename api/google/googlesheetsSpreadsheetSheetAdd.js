const { ArgsWarden, objHasAny } = require('../utils');
const { credsValidator } = require('../validators');
const { getGoogleSheets, googleApiCall } = require('../google/google.utils');
const { googlesheetsSpreadsheetTrim } = require('../google/googlesheetsSpreadsheetTrim');

const spreadsheetIdentifierValidator = (spreadsheetIdentifier) => {
  return objHasAny(spreadsheetIdentifier, ['spreadsheetId']);
};

const dataValidator = (data) => {
  return objHasAny(data, ['objArray']) && Array.isArray(data.objArray);
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['spreadsheetIdentifier', spreadsheetIdentifierValidator],
  ['data', dataValidator],
]);

const googlesheetsSpreadsheetSheetAdd = async (
  credsPayload,
  spreadsheetIdentifier,
  data,
  {
    sheetName = String(Date.now()),
    trim = true,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    spreadsheetIdentifier,
    data,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const { spreadsheetId } = spreadsheetIdentifier;
  const { objArray } = data;

  const { client, error } = await getGoogleSheets(credsPayload);

  if (error) {
    return error;
  }

  const allKeys = new Set();
  for (const obj of objArray) {
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach((key) => allKeys.add(key));
    }
  }
  const headers = Array.from(allKeys);

  if (!headers.length) {
    return {
      ok: false,
      error: {
        code: 'EMPTY_OBJ_ARRAY',
        message: 'objArray contains no valid objects with keys',
      },
    };
  }

  const values = [
    headers,
    ...objArray.map((obj) => {
      return headers.map((header) => {
        const value = obj?.[header];
        return value === null || value === undefined ? '' : value;
      });
    }),
  ];

  const batchUpdateResponse = await googleApiCall(() => client.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          addSheet: {
            properties: {
              title: String(sheetName),
            },
          },
        },
      ],
    },
  }));

  if (!batchUpdateResponse.ok) {
    return batchUpdateResponse;
  }

  const newSheetId = batchUpdateResponse.data.replies[0].addSheet.properties.sheetId;

  const updateResponse = await googleApiCall(() => client.spreadsheets.values.update({
    spreadsheetId,
    range: `${ sheetName }!A1`,
    valueInputOption: 'RAW',
    requestBody: {
      values,
    },
  }));

  if (!updateResponse.ok) {
    return updateResponse;
  }

  if (trim) {
    googlesheetsSpreadsheetTrim(
      credsPayload,
      spreadsheetIdentifier,
    );
  }

  const sheetUrl = `https://docs.google.com/spreadsheets/d/${ spreadsheetId }/edit#gid=${ newSheetId }`;

  return {
    ok: true,
    data: {
      sheetId: newSheetId,
      sheetName: String(sheetName),
      sheetUrl,
      rowsAdded: values.length,
      columnsAdded: headers.length,
      updateResponse: updateResponse.data,
    },
  };
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  googlesheetsSpreadsheetSheetAdd,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/googlesheetsSpreadsheetSheetAdd" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "google" },
    "spreadsheetIdentifier": { "spreadsheetId": "ABC123" },
    "data": { "objArray": [{ "fruit": "apple", "colour": "red" }] },
    "options": { "sheetName": "Fruits" }
  }'
*/
