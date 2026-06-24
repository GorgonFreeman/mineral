const fs = require('fs');
const path = require('path');
const http = require('http');
const { respondJson, errorToReadable, getRequestBody, argsFromBody } = require('./server.utils');

const apiDirectory = path.join(__dirname, 'api');

const camelCaseToPathSegments = (value) => {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1/$2')
    .toLowerCase();
};

const shouldSkipApiFile = (fileName) => {
  if (!fileName.endsWith('.js')) {
    return true;
  }

  if (fileName.endsWith('.utils.js')) {
    return true;
  }

  const skippedFiles = new Set([
    'utils.js',
    'validators.js',
  ]);

  return skippedFiles.has(fileName);
};

const walkFilesRecursive = (directory) => {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFilesRecursive(entryPath));
      continue;
    }

    if (entry.isFile()) {
      files.push(entryPath);
    }
  }

  return files;
};

const routePathsForExport = (filePath, exportName) => {
  const relativeDirectory = path.relative(apiDirectory, path.dirname(filePath));
  const directorySegments = relativeDirectory === '.'
    ? []
    : relativeDirectory.split(path.sep).filter(Boolean);

  const canonicalPath = [
    ...directorySegments,
    exportName,
  ].join('/');

  const directoryPrefix = directorySegments[directorySegments.length - 1];
  let trimmedExportName = exportName;
  if (directoryPrefix) {
    const directoryPrefixLower = directoryPrefix.toLowerCase();
    const exportNameLower = exportName.toLowerCase();
    if (exportNameLower.startsWith(directoryPrefixLower)) {
      trimmedExportName = exportName.slice(directoryPrefix.length) || exportName;
    }
  }

  const prettyPath = [
    ...directorySegments,
    camelCaseToPathSegments(trimmedExportName).replace(/^\//, ''),
  ].filter(Boolean).join('/');

  return [
    `/${ canonicalPath }`,
    `/${ prettyPath }`,
  ];
};

const loadHandlers = () => {
  const files = walkFilesRecursive(apiDirectory).filter((filePath) => !shouldSkipApiFile(path.basename(filePath)));
  const routeToHandler = new Map();

  for (const filePath of files) {
    const moduleExports = require(filePath);
    if (!moduleExports || typeof moduleExports !== 'object') {
      continue;
    }

    for (const [exportName, exportedValue] of Object.entries(moduleExports)) {
      if (typeof exportedValue !== 'function') {
        continue;
      }

      const routePaths = routePathsForExport(filePath, exportName);
      for (const routePath of routePaths) {
        routeToHandler.set(routePath, {
          filePath,
          exportName,
          handler: exportedValue,
        });
      }
    }
  }

  return routeToHandler;
};

const handlers = loadHandlers();

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    const routes = Array.from(handlers.keys()).sort();
    respondJson(res, 200, {
      ok: true,
      data: {
        routes,
      },
    });
    return;
  }

  if (req.method !== 'POST') {
    respondJson(res, 405, {
      ok: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST is supported for function routes.',
      },
    });
    return;
  }

  const pathOnly = (req.url || '/').split('?')[0];
  const matchedHandler = handlers.get(pathOnly);
  if (!matchedHandler) {
    respondJson(res, 404, {
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: `No handler found for route ${ pathOnly }`,
      },
    });
    return;
  }

  try {
    const body = await getRequestBody(req);
    const args = argsFromBody(body);
    const result = await matchedHandler.handler(...args);

    if (result === undefined) {
      respondJson(res, 200, {
        ok: true,
      });
      return;
    }

    respondJson(res, 200, result);
  } catch (error) {
    respondJson(res, 500, {
      ok: false,
      error: {
        code: 'UNHANDLED_ERROR',
        message: 'Unhandled server error.',
        details: errorToReadable(error),
      },
    });
  }
});

const { PORT = 8000 } = process.env;
server.listen(PORT, () => {
  console.log(`Mineral server running on port ${ PORT }`);
  console.log('Registered routes:');
  for (const route of Array.from(handlers.keys()).sort()) {
    console.log(route);
  }
});
