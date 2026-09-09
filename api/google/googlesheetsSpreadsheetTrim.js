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

const googlesheetsSpreadsheetTrim = async (
  credsPayload,
  spreadsheetIdentifier,
  {
  } = {},
) => {
  const { spreadsheetId } = spreadsheetIdentifier;

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
      ok: true,
      data: {
        message: 'No sheets found in spreadsheet',
        trimmed: [],
      },
    };
  }

  const sheetsToProcess = sheetsArray
    .map((sheet) => {
      const { properties } = sheet;
      const { sheetId, title: sheetTitle, gridProperties } = properties;
      const { rowCount, columnCount } = gridProperties || {};

      if (!rowCount || !columnCount) {
        return null;
      }

      return {
        sheetId,
        sheetTitle,
        rowCount,
        columnCount,
      };
    })
    .filter(Boolean);

  if (!sheetsToProcess.length) {
    return {
      ok: true,
      data: {
        message: 'No sheets with valid grid properties found',
        sheetsProcessed: sheetsArray.length,
        sheetsTrimmed: 0,
        sheetResults: [],
      },
    };
  }

  const batchValuesResponse = await googleApiCall(() => client.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges: sheetsToProcess.map((sheet) => `${ sheet.sheetTitle }!A:ZZ`),
  }));

  if (!batchValuesResponse.ok) {
    return batchValuesResponse;
  }

  const { valueRanges } = batchValuesResponse.data;

  const trimRequests = [];
  const sheetResults = [];

  for (let i = 0; i < sheetsToProcess.length; i++) {
    const sheet = sheetsToProcess[i];
    const { sheetId, sheetTitle, rowCount, columnCount } = sheet;
    const valueRange = valueRanges[i];
    const { values } = valueRange || {};

    if (!values || values.length === 0) {
      if (rowCount > 1) {
        trimRequests.push({
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: 1,
            },
          },
        });
      }
      if (columnCount > 1) {
        trimRequests.push({
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'COLUMNS',
              startIndex: 1,
            },
          },
        });
      }
      if (rowCount > 1 || columnCount > 1) {
        sheetResults.push({
          sheetTitle,
          sheetId,
          trimmed: true,
          originalRows: rowCount,
          originalColumns: columnCount,
          newRows: 1,
          newColumns: 1,
        });
      } else {
        sheetResults.push({
          sheetTitle,
          sheetId,
          trimmed: false,
          message: 'No trimming needed',
        });
      }
      continue;
    }

    let maxRows = values.length;
    let maxCols = 0;
    for (const row of values) {
      if (row && row.length > maxCols) {
        maxCols = row.length;
      }
    }

    maxRows = Math.max(1, maxRows);
    maxCols = Math.max(1, maxCols);

    if (rowCount > maxRows) {
      trimRequests.push({
        deleteDimension: {
          range: {
            sheetId,
            dimension: 'ROWS',
            startIndex: maxRows,
          },
        },
      });
    }

    if (columnCount > maxCols) {
      trimRequests.push({
        deleteDimension: {
          range: {
            sheetId,
            dimension: 'COLUMNS',
            startIndex: maxCols,
          },
        },
      });
    }

    if (rowCount > maxRows || columnCount > maxCols) {
      sheetResults.push({
        sheetTitle,
        sheetId,
        trimmed: true,
        originalRows: rowCount,
        originalColumns: columnCount,
        newRows: maxRows,
        newColumns: maxCols,
      });
    } else {
      sheetResults.push({
        sheetTitle,
        sheetId,
        trimmed: false,
        message: 'No trimming needed',
      });
    }
  }

  let batchUpdateResult = null;
  if (trimRequests.length > 0) {
    const batchUpdateResponse = await googleApiCall(() => client.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: trimRequests,
      },
    }));

    if (!batchUpdateResponse.ok) {
      return batchUpdateResponse;
    }

    batchUpdateResult = batchUpdateResponse.data;
  }

  return {
    ok: true,
    data: {
      sheetsProcessed: sheetsArray.length,
      sheetsTrimmed: sheetResults.filter((s) => s.trimmed).length,
      sheetResults,
      batchUpdateResult,
    },
  };
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  googlesheetsSpreadsheetTrim,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/googlesheetsSpreadsheetTrim" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "google" },
    "spreadsheetIdentifier": { "spreadsheetId": "ABC123" }
  }'
*/
