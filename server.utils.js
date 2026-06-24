const { StringDecoder } = require('string_decoder');
const { Chain } = require('./api/utils');

const respondJson = (res, statusCode, payload) => {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
};

const errorToReadable = (error) => {
  if (!error) {
    return {
      message: 'Unknown error',
    };
  }

  if (typeof error === 'string') {
    return {
      message: error,
    };
  }

  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };
};

const getRequestBody = async (req) => {
  if (req.method === 'GET' || req.method === 'HEAD') {
    return undefined;
  }

  const decoder = new StringDecoder('utf8');

  return await new Promise((resolve, reject) => {
    let buffer = '';

    req.on('data', (chunk) => {
      buffer += decoder.write(chunk);
    });

    req.on('end', () => {
      buffer += decoder.end();

      if (!buffer.trim()) {
        resolve(undefined);
        return;
      }

      try {
        resolve(JSON.parse(buffer));
      } catch (error) {
        reject(new Error(`Invalid JSON body: ${ error.message }`));
      }
    });

    req.on('error', reject);
  });
};

const argsFromBody = (body) => {
  if (Array.isArray(body)) {
    return body;
  }

  if (Array.isArray(body?.args)) {
    return body.args;
  }

  if (body === undefined) {
    return [];
  }

  return [body];
};

const valueProvided = (value) => value !== undefined && value !== null;

const mergeRequestContext = (requestContext, update) => {
  if (!update || typeof update !== 'object') {
    return requestContext;
  }

  return {
    ...requestContext,
    ...update,
  };
};

const runRequestHandler = async (requestHandler, requestContext) => {
  if (!requestHandler) {
    return requestContext;
  }

  if (requestHandler instanceof Chain) {
    const handlerOutput = await requestHandler.run(requestContext);
    return mergeRequestContext(requestContext, handlerOutput);
  }

  if (Array.isArray(requestHandler)) {
    let updatedRequestContext = requestContext;
    for (const requestHandlerStep of requestHandler) {
      if (typeof requestHandlerStep !== 'function') {
        throw new Error('requestHandler array only supports functions');
      }
      const stepOutput = await requestHandlerStep(updatedRequestContext);
      updatedRequestContext = mergeRequestContext(updatedRequestContext, stepOutput);
    }
    return updatedRequestContext;
  }

  if (typeof requestHandler === 'function') {
    const handlerOutput = await requestHandler(requestContext);
    return mergeRequestContext(requestContext, handlerOutput);
  }

  throw new Error('requestHandler must be a function, array of functions, or a Chain');
};

const funcApi = (func, config = {}) => {
  const {
    requestHandler,
    argNames,
    validatorsByArg = {},
    validators = [],
    requestVerifiers = [],
    bodyModifiers = [],
    passThroughReq = false,
    passThroughBody = false,
  } = config;

  return async ({
    req,
    res,
    body,
    args,
  }) => {
    let requestContext = {
      req,
      res,
      body,
      args,
    };

    requestContext = await runRequestHandler(requestHandler, requestContext);
    if (requestContext?.response !== undefined) {
      return requestContext.response;
    }

    for (const requestVerifier of requestVerifiers) {
      const verified = await requestVerifier(
        requestContext.req,
        requestContext.res,
        requestContext.body,
        requestContext,
      );
      if (!verified) {
        return {
          ok: false,
          error: {
            code: 'REQUEST_NOT_VERIFIED',
            message: 'Request verification failed.',
          },
        };
      }
    }

    let modifiedBody = requestContext.body;
    for (const bodyModifier of bodyModifiers) {
      modifiedBody = await bodyModifier(modifiedBody, requestContext.req, requestContext.res, requestContext);
    }
    requestContext.body = modifiedBody;

    if (argNames?.length) {
      for (const argName of argNames) {
        const validator = validatorsByArg[argName] || valueProvided;
        const valid = await validator(
          modifiedBody?.[argName],
          modifiedBody,
          requestContext.req,
          requestContext.res,
          requestContext,
        );
        if (!valid) {
          return {
            ok: false,
            error: {
              code: 'INVALID_ARGS',
              message: `Invalid arg: ${ argName }`,
            },
          };
        }
      }
    }

    for (const validator of validators) {
      const valid = await validator(
        modifiedBody,
        requestContext.req,
        requestContext.res,
        requestContext,
      );
      if (!valid) {
        return {
          ok: false,
          error: {
            code: 'INVALID_BODY',
            message: 'Request body failed validation.',
          },
        };
      }
    }

    let callArgs = requestContext.args;
    if (passThroughReq) {
      callArgs = [requestContext.req];
    } else if (passThroughBody) {
      callArgs = [modifiedBody];
    } else if (argNames?.length) {
      callArgs = argNames.map((argName) => modifiedBody?.[argName]);
    }

    return await func(...callArgs);
  };
};

module.exports = {
  respondJson,
  errorToReadable,
  getRequestBody,
  argsFromBody,
  funcApi,
};
