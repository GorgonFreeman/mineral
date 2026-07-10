const fs = require('fs');
const http = require('http');
const { respondJson, errorToReadable, getRequestBody, argsFromBody, funcApi } = require('./server.utils');
const { getWorkspace, setWorkspace, loadWorkspaceEnv, toAbsolutePath } = require('./api/workspace');

const MINERAL_API_DIR = `${ __dirname }/api`;

const SKIPPED_FILES = new Set([
  'server.js',
  'utils.js',
  'validators.js',
  'workspace.js',
]);

// --- Config ---

const splitCommaList = (value = '') => value
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const readCliFlag = (flag) => {
  const args = process.argv.slice(2);
  const equalsPrefix = `${ flag }=`;

  for (let index = 0; index < args.length; index++) {
    if (args[index].startsWith(equalsPrefix)) {
      return args[index].slice(equalsPrefix.length);
    }

    if (args[index] === flag) {
      return args[index + 1];
    }
  }
};

const getApiDirs = (options = {}) => {
  if (options.api_dirs) {
    return options.api_dirs;
  }

  const fromCli = readCliFlag('--api_dirs');
  if (fromCli) {
    return splitCommaList(fromCli);
  }

  if (process.env.MINERAL_API_DIRS) {
    return splitCommaList(process.env.MINERAL_API_DIRS);
  }

  return [];
};

const getConfig = (options = {}) => ({
  port: Number(options.port ?? process.env.PORT ?? 8000),
  workspace: toAbsolutePath(
    options.workspace
      ?? readCliFlag('--workspace')
      ?? process.env.MINERAL_WORKSPACE
      ?? process.cwd(),
  ),
  api_dirs: getApiDirs(options),
});

// --- Handler discovery ---

const isHandlerFile = (fileName) => {
  if (!fileName.endsWith('.js')) {
    return false;
  }

  if (fileName.startsWith('_')) {
    return false;
  }

  if (fileName.endsWith('.utils.js')) {
    return false;
  }

  return !SKIPPED_FILES.has(fileName);
};

const routeNameFromFile = (filePath) => {
  const fileName = filePath.split('/').pop();
  return fileName.slice(0, -3);
};

const listJsFiles = (directory) => {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const files = [];
  const entries = fs.readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = `${ directory }/${ entry.name }`;

    if (entry.isDirectory()) {
      files.push(...listJsFiles(entryPath));
      continue;
    }

    if (entry.isFile() && isHandlerFile(entry.name)) {
      files.push(entryPath);
    }
  }

  return files;
};

const directoriesToScan = ({
  workspace,
  api_dirs,
}) => {
  const extraDirs = api_dirs.map((dir) => (
    dir.startsWith('/')
      ? dir
      : `${ workspace }/${ dir }`
  ));

  return [MINERAL_API_DIR, ...extraDirs];
};

const getFuncApiConfig = ({
  moduleExports,
  routeName,
}) => {
  const { funcApiConfig } = moduleExports;
  if (!funcApiConfig || typeof funcApiConfig !== 'object') {
    return undefined;
  }

  if (funcApiConfig[routeName]) {
    return funcApiConfig[routeName];
  }

  const exportNames = Object.keys(moduleExports).filter((key) => key !== 'funcApiConfig');
  const configIsShared = !exportNames.some((name) => funcApiConfig[name]);

  if (configIsShared) {
    return funcApiConfig;
  }
};

const addHandlerFromFile = (filePath, handlers) => {
  const moduleExports = require(filePath);
  if (!moduleExports || typeof moduleExports !== 'object') {
    return;
  }

  const routeName = routeNameFromFile(filePath);
  const handlerFn = moduleExports[routeName];
  if (typeof handlerFn !== 'function') {
    return;
  }

  const funcApiConfig = getFuncApiConfig({
    moduleExports,
    routeName,
  });

  const route = `/${ routeName }`;
  if (handlers.has(route)) {
    const existing = handlers.get(route);
    throw new Error(`Duplicate route '${ route }' from ${ filePath } and ${ existing.filePath }`);
  }

  handlers.set(route, {
    filePath,
    routeName,
    handler: funcApiConfig ? funcApi(handlerFn, funcApiConfig) : handlerFn,
    usesFuncApi: Boolean(funcApiConfig),
  });
};

const loadHandlers = (config) => {
  const handlers = new Map();

  for (const directory of directoriesToScan(config)) {
    for (const filePath of listJsFiles(directory)) {
      addHandlerFromFile(filePath, handlers);
    }
  }

  return handlers;
};

// --- HTTP ---

const createServer = (handlers) => http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    respondJson(res, 200, {
      ok: true,
      data: {
        routes: [...handlers.keys()].sort(),
        workspace: getWorkspace(),
      },
    });
    return;
  }

  const route = (req.url || '/').split('?')[0];
  const handler = handlers.get(route);
  if (!handler) {
    respondJson(res, 404, {
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: `No handler found for route ${ route }`,
      },
    });
    return;
  }

  try {
    const body = await getRequestBody(req);
    const args = argsFromBody(body);
    const result = handler.usesFuncApi
      ? await handler.handler({ req, res, body, args })
      : await handler.handler(...args);

    if (result === undefined) {
      respondJson(res, 200, { ok: true });
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

// --- Start ---

let server = null;
let handlers = null;

const logStartup = ({
  port,
  workspace,
  api_dirs,
  handlers: routeHandlers,
}) => {
  console.log(`Mineral server running on port ${ port }`);
  console.log(`Workspace: ${ workspace }`);

  if (api_dirs.length) {
    console.log('Extra API dirs:', api_dirs.join(', '));
  }

  console.log('Registered routes:');
  for (const route of [...routeHandlers.keys()].sort()) {
    console.log(route);
  }
};

const startServer = (options = {}) => {
  const config = getConfig(options);

  setWorkspace(config.workspace);
  loadWorkspaceEnv();

  handlers = loadHandlers(config);
  server = createServer(handlers);

  server.listen(config.port, () => logStartup({
    ...config,
    handlers,
  }));

  return server;
};

module.exports = {
  startServer,
  loadHandlers,
  get server() {
    if (!server) {
      startServer();
    }

    return server;
  },
  get handlers() {
    if (!handlers) {
      startServer();
    }

    return handlers;
  },
};

if (require.main === module) {
  startServer();
}
