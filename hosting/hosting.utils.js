const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { createRequire } = require('module');
const yaml = require('yaml');
const { getRequirePathForHandler } = require('./handlerPaths');
const {
  respondJson,
  errorToReadable,
  getRequestBody,
  argsFromBody,
  funcApi,
  wrapFunction,
  statusCodeFromResult,
} = require('../server.utils');

dotenv.config({
  path: path.join(process.cwd(), '.env'),
});

const MINERAL_WRAPPERS_MODULE = '@foxtware/mineral/hosting/wrappers.js';
const WORKSPACE_WRAPPERS_MODULE = './hosting/wrappers.js';

const getHostingDir = (workspace) => `${ workspace.replace(/\/$/, '') }/hosting`;

const getMineralWrappers = (workspaceRequire) => {
  try {
    return workspaceRequire(MINERAL_WRAPPERS_MODULE);
  } catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') {
      throw error;
    }

    return require('./wrappers.js');
  }
};

const resolveWrapperName = (wrapperName, workspaceRequire) => {
  if (typeof wrapperName !== 'string' || !wrapperName.trim()) {
    throw new Error(`Invalid wrapper name: ${ wrapperName }`);
  }

  const mineralWrappers = getMineralWrappers(workspaceRequire);
  if (typeof mineralWrappers[wrapperName] === 'function') {
    return {
      wrapperName,
      modulePath: MINERAL_WRAPPERS_MODULE,
    };
  }

  try {
    const workspaceWrappers = workspaceRequire(WORKSPACE_WRAPPERS_MODULE);
    if (typeof workspaceWrappers[wrapperName] === 'function') {
      return {
        wrapperName,
        modulePath: WORKSPACE_WRAPPERS_MODULE,
      };
    }
  } catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') {
      throw error;
    }
  }

  throw new Error(
    `Wrapper "${ wrapperName }" not found in ${ MINERAL_WRAPPERS_MODULE } or ${ WORKSPACE_WRAPPERS_MODULE }`,
  );
};

const getHostedEntries = (functions = {}) => (
  Object.entries(functions).map(([hostedName, functionConfig = {}]) => ({
    hostedName,
    handlerName: functionConfig.entry_point || functionConfig.entryPoint || hostedName,
    wrappers: Array.isArray(functionConfig.wrappers) ? functionConfig.wrappers : [],
  }))
);

const functionUsesWrapper = (functionConfig = {}, wrapperName) => (
  Array.isArray(functionConfig.wrappers) && functionConfig.wrappers.includes(wrapperName)
);

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

const wrapHostedFunction = (loader, exportName, wrappers = []) => {
  let handler = null;
  let usesFuncApi = false;

  const coreHandler = async (req, res) => {
    if (!handler) {
      const moduleExports = loader();
      const handlerFn = moduleExports[exportName];

      if (typeof handlerFn !== 'function') {
        throw new Error(`Hosted export not found: ${ exportName }`);
      }

      const funcApiConfig = getFuncApiConfig({
        moduleExports,
        routeName: exportName,
      });

      usesFuncApi = Boolean(funcApiConfig);
      handler = usesFuncApi ? funcApi(handlerFn, funcApiConfig) : handlerFn;
    }

    const body = await getRequestBody(req);
    const args = argsFromBody(body);
    return usesFuncApi
      ? await handler({ req, res, body, args })
      : await handler(...args);
  };

  const wrappedHandler = wrapFunction(coreHandler, wrappers);

  return async (req, res) => {
    try {
      const result = await wrappedHandler(req, res);

      if (res.headersSent) {
        return;
      }

      if (result === undefined) {
        respondJson(res, 200, { ok: true });
        return;
      }

      const statusCode = statusCodeFromResult(result);
      respondJson(res, statusCode, result);
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
  };
};

const readHostingYml = (workspace) => {
  const hostingPath = `${ getHostingDir(workspace) }/.hosting.yml`;

  if (!fs.existsSync(hostingPath)) {
    throw new Error(`Missing hosting/.hosting.yml in workspace: ${ workspace }`);
  }

  const hostingText = fs.readFileSync(hostingPath, 'utf8');
  const hostingConfig = yaml.parse(hostingText);

  if (!hostingConfig || typeof hostingConfig !== 'object' || Array.isArray(hostingConfig)) {
    throw new Error('Invalid hosting/.hosting.yml');
  }

  return hostingConfig;
};

const getCredsJsonForDeploy = (workspace) => {
  const credsPath = `${ workspace }/.creds.yml`;

  if (!fs.existsSync(credsPath)) {
    throw new Error(`Missing .creds.yml in workspace: ${ workspace }`);
  }

  const credsText = fs.readFileSync(credsPath, 'utf8');
  return JSON.stringify(yaml.parse(credsText));
};

const ensureWorkspaceEnvForDeploy = (workspace) => {
  const { copyCredsToEnv } = require('./copyCredsToEnv');
  const envPath = `${ workspace.replace(/\/$/, '') }/.env`;

  copyCredsToEnv(workspace);

  if (!fs.existsSync(envPath)) {
    throw new Error(`Missing .env in workspace: ${ workspace }`);
  }
};

const resolveHostedHandlersForDeploy = ({
  functions = {},
  workspace,
  handlersByName,
}) => {
  const workspaceRequire = createRequire(`${ workspace.replace(/\/$/, '') }/package.json`);
  const hostedEntries = getHostedEntries(functions);

  return hostedEntries.map((hostedEntry) => {
    const { handlerName, wrappers = [] } = hostedEntry;

    const resolvedWrappers = wrappers.map((wrapperName) => (
      resolveWrapperName(wrapperName, workspaceRequire)
    ));

    const handler = handlersByName.get(handlerName);
    if (!handler) {
      throw new Error(
        `Function "${ handlerName }" not found — add a handler in workspace api dirs or mineral api`,
      );
    }

    return {
      ...hostedEntry,
      resolvedWrappers,
      requirePath: getRequirePathForHandler(handler, workspace),
    };
  });
};

// TODO: support credsPayload in google_cloud_info instead of full workspace .creds.yml

module.exports = {
  getHostingDir,
  resolveWrapperName,
  getFuncApiConfig,
  wrapHostedFunction,
  readHostingYml,
  getCredsJsonForDeploy,
  ensureWorkspaceEnvForDeploy,
  getHostedEntries,
  resolveHostedHandlersForDeploy,
  functionUsesWrapper,
  MINERAL_WRAPPERS_MODULE,
  WORKSPACE_WRAPPERS_MODULE,
};
