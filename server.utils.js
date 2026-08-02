const { logDeep } = require('./api/utils');
const { HOSTED } = require('./api/constants');
const { StringDecoder } = require('string_decoder');

const respondJson = (res, statusCode, payload) => {
  !HOSTED && logDeep(payload);
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

  if (req.body !== undefined) {
    return req.body;
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

  if (typeof requestHandler?.run !== 'function' && typeof requestHandler !== 'function') {
    throw new Error('requestHandler must be a function, array of functions, or a Chain');
  }

  const handlerOutput = await requestHandler?.run(requestContext) || await requestHandler(requestContext);
  return mergeRequestContext(requestContext, handlerOutput);
};

const wrapFunction = (func, {
  beforeWrappers = [],
  afterWrappers = [],
} = {}) => async (req, res, ...rest) => {
  for (const beforeWrapper of beforeWrappers) {
    const beforeResult = await beforeWrapper(req, res);
    if (beforeResult?.handled) {
      return;
    }
    if (beforeResult) {
      return beforeResult;
    }
  }

  if (!afterWrappers.length) {
    return func(req, res, ...rest);
  }

  let result;

  try {
    result = await func(req, res, ...rest);
  } catch (error) {
    result = {
      ok: false,
      error: {
        code: 'UNHANDLED_ERROR',
        message: 'Unhandled server error.',
        details: errorToReadable(error),
      },
    };
  }

  for (const afterWrapper of afterWrappers) {
    try {
      await afterWrapper(req, res, result);
    } catch (error) {
      console.log('wrapFunction afterWrapper error', error);
    }
  }

  return result;
};

const statusCodeFromResult = (result) => {
  if (result?.ok === false) {
    return result?.error?.statusCode ?? 400;
  }

  return 200;
};

const funcApi = (func, config = {}) => {
  const {
    requestHandler,
    argsWarden,
    validators = [],
    requestVerifiers = [],
    bodyModifiers = [],
    passThroughReq = false,
    passThroughBody = false,
  } = config;

  const argNames = argsWarden?.argNames();

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

    if (argsWarden) {
      const rejectResponse = await argsWarden.responseIfRejectingArgs(
        Object.fromEntries(argNames.map((argName) => [argName, modifiedBody?.[argName]])),
        { ...modifiedBody },
      );
      if (rejectResponse) {
        return rejectResponse;
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
      requestContext.req.body = modifiedBody;
      callArgs = [requestContext.req];
    } else if (passThroughBody) {
      callArgs = [modifiedBody];
    } else if (argNames?.length) {
      callArgs = argNames.map((argName) => modifiedBody?.[argName]);

      if (
        !argNames.includes('options')
        && modifiedBody?.options !== undefined
      ) {
        callArgs.push(modifiedBody.options);
      }
    }

    return await func(...callArgs);
  };
};

module.exports = {
  respondJson,
  errorToReadable,
  getRequestBody,
  argsFromBody,
  wrapFunction,
  statusCodeFromResult,
  funcApi,
};
