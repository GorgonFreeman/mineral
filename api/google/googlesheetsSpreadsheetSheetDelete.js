// https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets/request#deletesheetrequest

const { ArgsWarden, ensureArray, objHasAny } = require('../utils');
const { credsValidator } = require('../validators');
const { getGoogleSheets, googleApiCall } = require('../google/google.utils');

const spreadsheetIdentifierValidator = (spreadsheetIdentifier) => {
  return objHasAny(spreadsheetIdentifier, ['spreadsheetId']);
};

const sheetIdentifierValidator = (sheetIdentifier) => {
  const sheetIdentifiers = ensureArray(sheetIdentifier);

  return sheetIdentifiers.length > 0
    && sheetIdentifiers.every((identifier) => {
      return objHasAny(identifier, ['sheetName', 'sheetId']);
    });
};

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['spreadsheetIdentifier', spreadsheetIdentifierValidator],
  ['sheetIdentifier', sheetIdentifierValidator],
]);

const googlesheetsSpreadsheetSheetDelete = async (
  credsPayload,
  spreadsheetIdentifier,
  sheetIdentifier,
  {
    missingOk = true,
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
  const sheetIdentifiers = ensureArray(sheetIdentifier);

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

  const sheetsArray = spreadsheetResponse.data?.sheets || [];

  const resolved = [];
  const missing = [];

  for (const { sheetName, sheetId } of sheetIdentifiers) {
    const sheet = sheetsArray.find(({ properties }) => {
      return sheetId !== undefined
        ? properties.sheetId === sheetId
        : properties.title === sheetName;
    });

    if (!sheet) {
      missing.push({ sheetName, sheetId });
      continue;
    }

    resolved.push({
      sheetId: sheet.properties.sheetId,
      sheetName: sheet.properties.title,
    });
  }

  if (missing.length && !missingOk) {
    return {
      ok: false,
      error: {
        code: 'SHEET_NOT_FOUND',
        message: `Sheet not found: ${ JSON.stringify(missing) }`,
      },
    };
  }

  // Sheets refuses to remove the last remaining tab, so say so plainly rather
  // than letting the API error surface without context.
  if (resolved.length && resolved.length === sheetsArray.length) {
    return {
      ok: false,
      error: {
        code: 'CANNOT_DELETE_ALL_SHEETS',
        message: 'A spreadsheet must keep at least one sheet',
      },
    };
  }

  if (!resolved.length) {
    return {
      ok: true,
      data: {
        deleted: [],
        missing,
      },
    };
  }

  const batchUpdateResponse = await googleApiCall(() => client.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: resolved.map(({ sheetId }) => ({
        deleteSheet: {
          sheetId,
        },
      })),
    },
  }));

  if (!batchUpdateResponse.ok) {
    return batchUpdateResponse;
  }

  return {
    ok: true,
    data: {
      deleted: resolved,
      missing,
    },
  };
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  googlesheetsSpreadsheetSheetDelete,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/googlesheetsSpreadsheetSheetDelete" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "google" },
    "spreadsheetIdentifier": { "spreadsheetId": "ABC123" },
    "sheetIdentifier": [{ "sheetName": "AU" }, { "sheetName": "US" }]
  }'
*/
