const { StringDecoder } = require('string_decoder');

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

const funcApi = (func, config = {}) => {
  const {
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
    for (const requestVerifier of requestVerifiers) {
      const verified = await requestVerifier(req, res, body);
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

    let modifiedBody = body;
    for (const bodyModifier of bodyModifiers) {
      modifiedBody = await bodyModifier(modifiedBody, req, res);
    }

    if (argNames?.length) {
      for (const argName of argNames) {
        const validator = validatorsByArg[argName] || valueProvided;
        const valid = await validator(modifiedBody?.[argName], modifiedBody, req, res);
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
      const valid = await validator(modifiedBody, req, res);
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

    let callArgs = args;
    if (passThroughReq) {
      callArgs = [req];
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
