const fs = require('fs');
const yaml = require('yaml');
const {
  respondJson,
  errorToReadable,
  getRequestBody,
  argsFromBody,
  funcApi,
} = require('./server.utils');

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

const wrapHostedFunction = (loader, exportName) => {
  let handler = null;
  let usesFuncApi = false;

  return async (req, res) => {
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

    try {
      const body = await getRequestBody(req);
      const args = argsFromBody(body);
      const result = usesFuncApi
        ? await handler({ req, res, body, args })
        : await handler(...args);

      if (res.headersSent) {
        return;
      }

      if (result === undefined) {
        respondJson(res, 200, { ok: true });
        return;
      }

      respondJson(res, 200, result);
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

// TODO: support credsPayload in google_cloud_info instead of full workspace .creds.yml
// TODO: implement requireHostedApiKey in funcApi for scheduled/hosted requests

module.exports = {
  getFuncApiConfig,
  wrapHostedFunction,
  readHostingYml,
  getCredsJsonForDeploy,
};
