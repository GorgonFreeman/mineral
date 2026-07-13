const http = require('http');
const { createRequire } = require('module');
const { respondJson, errorToReadable } = require('../server.utils');
const { getWorkspace, setWorkspace, loadWorkspaceEnv, toAbsolutePath } = require('../api/workspace');
const { getApiDirs, readCliFlag } = require('../cli');
const { loadHandlers } = require('../server');
const {
  readHostingYml,
  resolveHostedHandlersForDeploy,
  wrapHostedFunction,
} = require('./hosting.utils');
const { copyCredsToEnv } = require('./copyCredsToEnv');

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

const handlerByRouteName = (handlers) => {
  const byName = new Map();

  for (const handler of handlers.values()) {
    byName.set(handler.routeName, handler);
  }

  return byName;
};

const loadHostedRoutes = (config) => {
  const { functions } = readHostingYml(config.workspace);
  const handlers = loadHandlers({
    ...config,
    host_mode: true,
  });
  const handlersByName = handlerByRouteName(handlers);
  const hostedHandlers = resolveHostedHandlersForDeploy({
    functions,
    workspace: config.workspace,
    handlersByName,
  });

  const workspaceRequire = createRequire(`${ config.workspace.replace(/\/$/, '') }/package.json`);
  const routes = new Map();

  for (const hostedHandler of hostedHandlers) {
    const {
      hostedName,
      handlerName,
      resolvedBeforeWrappers = [],
      resolvedAfterWrappers = [],
      requirePath,
    } = hostedHandler;

    const beforeWrappers = resolvedBeforeWrappers.map(({ modulePath, wrapperName }) => (
      workspaceRequire(modulePath)[wrapperName]
    ));
    const afterWrappers = resolvedAfterWrappers.map(({ modulePath, wrapperName }) => (
      workspaceRequire(modulePath)[wrapperName]
    ));

    routes.set(
      `/${ hostedName }`,
      wrapHostedFunction(
        () => workspaceRequire(requirePath),
        handlerName,
        {
          beforeWrappers,
          afterWrappers,
        },
      ),
    );
  }

  return routes;
};

const createHostedPreviewServer = (handlers) => http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    respondJson(res, 200, {
      ok: true,
      data: {
        mode: 'hosting_preview',
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
        message: `No hosted handler found for route ${ route }`,
      },
    });
    return;
  }

  try {
    await handler(req, res);
  } catch (error) {
    if (res.headersSent) {
      return;
    }

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

const startHostingPreview = (options = {}) => {
  process.env.HOSTED = 'true';

  const config = getConfig(options);

  setWorkspace(config.workspace);
  copyCredsToEnv(config.workspace);
  loadWorkspaceEnv();

  const handlers = loadHostedRoutes(config);
  const server = createHostedPreviewServer(handlers);

  server.listen(config.port, () => {
    console.log(`Hosting preview running on port ${ config.port }`);
    console.log(`Workspace: ${ config.workspace }`);
    console.log('Hosted routes:');

    for (const route of [...handlers.keys()].sort()) {
      console.log(route);
    }
  });

  return server;
};

module.exports = {
  startHostingPreview,
  loadHostedRoutes,
};

if (require.main === module) {
  startHostingPreview();
}
