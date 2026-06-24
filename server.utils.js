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

module.exports = {
  respondJson,
  errorToReadable,
  getRequestBody,
  argsFromBody,
};
