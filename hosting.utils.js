const fs = require('fs');
const yaml = require('yaml');
const {
  respondJson,
  errorToReadable,
  getRequestBody,
  argsFromBody,
  funcApi,
  wrapFunction,
  requireHostedApiKey,
} = require('./server.utils');

const wrappersByName = {
  requireHostedApiKey,
};

const resolveWrappers = (wrapperNames = []) => (
  wrapperNames.map((wrapperName) => {
    const wrapper = wrappersByName[wrapperName];
    if (!wrapper) {
      throw new Error(`Unknown wrapper: ${ wrapperName }`);
    }
    return wrapper;
  })
);

const getHostedEntries = (functions = {}) => {
  const byEntryPoint = new Map();

  for (const [functionName, functionConfig] of Object.entries(functions)) {
    const entryPoint = functionConfig.entry_point || functionConfig.entryPoint || functionName;
    const existing = byEntryPoint.get(entryPoint) || {
      entryPoint,
      wrappers: [],
    };

    if (Array.isArray(functionConfig.wrappers)) {
      existing.wrappers.push(...functionConfig.wrappers);
      existing.wrappers = [...new Set(existing.wrappers)];
    }

    byEntryPoint.set(entryPoint, existing);
  }

  return [...byEntryPoint.values()];
};

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

const wrapHostedFunction = (loader, exportName, wrapperNames = []) => {
  let handler = null;
  let usesFuncApi = false;
  const wrappers = resolveWrappers(wrapperNames);

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

      const statusCode = result?.error?.code === 'UNAUTHORIZED' ? 401 : (
        result?.ok === false ? 400 : 200
      );
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
  const hostingPath = `${ workspace }/.hosting.yml`;

  if (!fs.existsSync(hostingPath)) {
    throw new Error(`Missing .hosting.yml in workspace: ${ workspace }`);
  }

  const hostingText = fs.readFileSync(hostingPath, 'utf8');
  const hostingConfig = yaml.parse(hostingText);

  if (!hostingConfig || typeof hostingConfig !== 'object' || Array.isArray(hostingConfig)) {
    throw new Error('Invalid .hosting.yml');
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

const getHostedApiKeyForDeploy = (workspace) => {
  const envPath = `${ workspace }/.env`;

  if (!fs.existsSync(envPath)) {
    return '';
  }

  const envText = fs.readFileSync(envPath, 'utf8');
  const match = envText.match(/^HOSTED_API_KEY=(.*)$/m);
  return match ? match[1].trim() : '';
};

// TODO: support credsPayload in google_cloud_info instead of full workspace .creds.yml

module.exports = {
  getFuncApiConfig,
  wrapHostedFunction,
  readHostingYml,
  getCredsJsonForDeploy,
  getHostedApiKeyForDeploy,
  getHostedEntries,
  functionUsesWrapper,
};
