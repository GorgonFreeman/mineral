require('dotenv').config();

const fs = require('fs');
const path = require('path');
const http = require('http');
const { respondJson, errorToReadable, getRequestBody, argsFromBody, funcApi } = require('./server.utils');

const apiDirectory = path.join(__dirname, 'api');

const shouldSkipApiFile = (fileName) => {
  if (!fileName.endsWith('.js')) {
    return true;
  }

  if (fileName.startsWith('_')) {
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

const loadHandlers = () => {
  const files = walkFilesRecursive(apiDirectory).filter((filePath) => !shouldSkipApiFile(path.basename(filePath)));
  const routeToHandler = new Map();

  for (const filePath of files) {
    const moduleExports = require(filePath);
    if (!moduleExports || typeof moduleExports !== 'object') {
      continue;
    }

    const fileBaseName = path.basename(filePath, '.js');
    const exportedValue = moduleExports[fileBaseName];

    if (typeof exportedValue !== 'function') {
      continue;
    }

    const {
      funcApiConfig,
    } = moduleExports;
    const functionExportNames = Object.entries(moduleExports)
      .filter(([exportName, exportValue]) => exportName !== 'funcApiConfig' && typeof exportValue === 'function')
      .map(([exportName]) => exportName);

    const getFuncApiConfigForExport = (exportName) => {
      if (!funcApiConfig || typeof funcApiConfig !== 'object') {
        return undefined;
      }

      const configByExportName = funcApiConfig[exportName];
      if (configByExportName && typeof configByExportName === 'object' && !Array.isArray(configByExportName)) {
        return configByExportName;
      }

      // If config isn't keyed by function names and this export matches the filename,
      // treat funcApiConfig as the config for that function.
      const configIsKeyedByFunctionName = functionExportNames.some((functionExportName) => funcApiConfig[functionExportName] !== undefined);
      if (!configIsKeyedByFunctionName && exportName === fileBaseName) {
        return funcApiConfig;
      }
    };

    const exportFuncApiConfig = getFuncApiConfigForExport(fileBaseName);
    const handler = exportFuncApiConfig
      ? funcApi(exportedValue, exportFuncApiConfig)
      : exportedValue;

    const routePath = `/${ fileBaseName }`;
    if (routeToHandler.has(routePath)) {
      const existing = routeToHandler.get(routePath);
      throw new Error(`Duplicate handler route '${ routePath }' from ${ filePath } and ${ existing.filePath }`);
    }

    routeToHandler.set(routePath, {
      filePath,
      exportName: fileBaseName,
      handler,
      usesFuncApi: Boolean(exportFuncApiConfig),
    });
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
    const result = matchedHandler.usesFuncApi
      ? await matchedHandler.handler({
        req,
        res,
        body,
        args,
      })
      : await matchedHandler.handler(...args);

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
